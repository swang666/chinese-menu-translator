import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const HOURLY_LIMIT = 20;           // 20 requests per IP per hour
const DAILY_TOTAL_LIMIT = 1000;    // 1000 total requests per day
const HOUR_IN_SECONDS = 60 * 60;   // 1 hour in seconds
const DAY_IN_SECONDS = 24 * 60 * 60; // 24 hours in seconds

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; error?: string }> {
    const hourlyKey = `rate_limit:${ip}:hourly`;
    const dailyTotalKey = `rate_limit:total:daily`;
    
    // Use pipeline to batch Redis operations
    const pipeline = redis.pipeline();
    
    // Increment both counters
    pipeline.incr(hourlyKey);
    pipeline.incr(dailyTotalKey);
    
    const [hourlyCount, totalCount] = await pipeline.exec() as number[];
    
    // Set expiration for first request
    if (hourlyCount === 1) {
        await redis.expire(hourlyKey, HOUR_IN_SECONDS);
    }
    if (totalCount === 1) {
        await redis.expire(dailyTotalKey, DAY_IN_SECONDS);
    }
    
    // Check hourly IP limit
    if (hourlyCount > HOURLY_LIMIT) {
        return { 
            allowed: false, 
            error: `IP rate limit exceeded. Maximum ${HOURLY_LIMIT} requests per hour.` 
        };
    }
    
    // Check daily total limit
    if (totalCount > DAILY_TOTAL_LIMIT) {
        return { 
            allowed: false, 
            error: 'Daily API limit reached. Please try again tomorrow.' 
        };
    }
    
    return { allowed: true };
}

export interface MenuItem {
    name: string;
    nameZh: string;
    price?: string;
    descriptionEn?: string;
    descriptionZh?: string;
  }

export async function POST(request: Request) {
    try {
        // Get IP address from request headers
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : 'unknown';

        // Check rate limits
        const { allowed, error } = await checkRateLimit(ip);
        if (!allowed) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: error 
                },
                { status: 429 }
            );
        }

        const { englishText } = await request.json()
        console.log('Received text:', englishText)

        const response = await fetch(
            "https://api-inference.huggingface.co/models/01-ai/Yi-1.5-34B-Chat",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                },
                body: JSON.stringify({
                    inputs: `<|im_start|>system
        You are a precise JSON generator that translates menu items from English to Chinese.
        <|im_end|>
        <|im_start|>user
        Translate these menu items to Chinese. Return ONLY a JSON response.
        
        Required JSON structure:
        {
          "items": [
            {
              "name": "first dish name",
              "nameZh": "第一道菜名",
              "price": "$XX.XX if present",
              "descriptionEn": "description if present",
              "descriptionZh": "描述如果有的话，并且保留英文的标点符号"
            }
          ]
        }
        
        Menu text:
        ${englishText}
        <|im_end|>
        <|im_start|>assistant
        `,
                    parameters: {
                        max_new_tokens: 1024,
                        temperature: 0.05,
                        top_p: 0.95,
                        return_full_text: false
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API response:', result)
        
        // Clean and parse the response
        let menuItems;
        try {
            let jsonStr = result[0].generated_text
                .replace(/```json|```|kotlin|javascript|json/g, '')
                .replace(/\n+/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/\\n/g, '')
                .replace(/\\\*/g, '*')           // Remove escaped asterisks
                .replace(/\\"/g, '"')            // Remove escaped quotes
                .replace(/\\/g, '')              // Remove any remaining backslashes
                .replace(/[^\x20-\x7E\u4e00-\u9fff\s,.()+-:*]/g, '')
                .replace(/"(\s*)"/, '""')
                .replace(/"\s+/g, '"')
                .replace(/\s+"/g, '"')
                .trim();
            
            const start = jsonStr.indexOf('{');
            const end = jsonStr.lastIndexOf('}') + 1;
            jsonStr = jsonStr.slice(start, end);
            
            console.log('Cleaned JSON:', jsonStr)
            
            const parsed = JSON.parse(jsonStr);
            
            if (!parsed.items || !Array.isArray(parsed.items)) {
                throw new Error('Invalid response format');
            }
            
            // Clean each item's text
            menuItems = parsed.items.map((item: MenuItem) => ({
                ...item,
                nameZh: item.nameZh?.replace(/[^\u4e00-\u9fff\s，。]/g, '').trim(),
                descriptionZh: item.descriptionZh?.replace(/[^\u4e00-\u9fff\s，。]/g, '').trim()
            })).filter((item: MenuItem) => 
                item.name && 
                item.nameZh && 
                typeof item.name === 'string' &&
                typeof item.nameZh === 'string'
            );

            if (menuItems.length === 0) {
                throw new Error('No valid menu items found');
            }

            console.log('Parsed items:', menuItems)
        } catch (e) {
            console.error('Parse error:', e);
            throw new Error('Failed to parse menu items from LLM response');
        }

        return NextResponse.json({ 
            success: true, 
            menuItems 
        })

    } catch (error) {
        console.error('Menu parsing error:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Failed to parse menu items'
            },
            { status: 500 }
        )
    }
} 