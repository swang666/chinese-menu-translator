import { NextResponse } from 'next/server'

export interface MenuItem {
    name: string;
    nameZh: string;
    price?: string;
    descriptionEn?: string;
    descriptionZh?: string;
  }

export async function POST(request: Request) {
    try {
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