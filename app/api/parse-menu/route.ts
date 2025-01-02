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
            "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                },
                body: JSON.stringify({
                    inputs: `<s>[INST] You are a menu translator specializing in food items. Your task is to identify and translate food items from OCR text.

Rules:
1. ONLY include items that are clearly food or beverages
2. Skip any text that doesn't look like a menu item
3. If you're unsure about an item, skip it
4. Keep descriptions short and food-focused
5. NO comments in the JSON
6. NO placeholder text
7. NO example items

Input text from OCR:
${englishText}

Return a JSON object in this exact format:
{
  "items": [
    {
      "name": "actual food name in English",
      "nameZh": "中文菜名",
      "price": "exact price if present",
      "descriptionEn": "short food description",
      "descriptionZh": "简短的食材和烹饪方法说明"
    }
  ]
}

Requirements:
- Only real food items
- Valid JSON format
- No comments or placeholders
- Chinese descriptions must only contain Chinese characters and punctuation
- Prices must be in $X.XX format
- Skip items if OCR text is unclear [/INST]</s>`,
                    parameters: {
                        max_new_tokens: 1024,
                        temperature: 0.1,
                        top_p: 0.95,
                        return_full_text: false
                    }
                }),
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
            const jsonStr = result[0].generated_text
                .replace(/```json|```|kotlin|javascript|json/g, '')
                .replace(/\/\/.+/g, '')
                .replace(/\n\s*\n/g, '\n')
                .trim();
            
            console.log('Cleaned JSON:', jsonStr)
            
            const validJsonStr = jsonStr.substring(jsonStr.indexOf('{'));
            
            const parsed = JSON.parse(validJsonStr);
            
            // Validate the structure
            if (!parsed.items || !Array.isArray(parsed.items)) {
                throw new Error('Invalid response format');
            }
            
            // Additional validation of each item
            menuItems = parsed.items.filter((item: MenuItem) => 
                item.name && 
                item.nameZh && 
                typeof item.name === 'string' &&
                typeof item.nameZh === 'string' &&
                item.nameZh.match(/^[\u4e00-\u9fa5，。：；！？、]+$/) // Only Chinese characters and punctuation
            );

            if (menuItems.length === 0) {
                throw new Error('No valid menu items found');
            }

            console.log('Parsed and validated items:', menuItems)
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