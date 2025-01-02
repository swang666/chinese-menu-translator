import { NextResponse } from 'next/server'

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
                    inputs: `<s>[INST] You are a helpful assistant that specializes in Chinese restaurant menus.
The following text was extracted from a menu image using OCR (Tesseract), so there might be some recognition errors.
Please:
1. Identify individual menu items
2. Translate each item and its description to Chinese
3. Clean up any OCR errors
4. Return a JSON array where each menu item is a separate object

Text from menu:
${englishText}

Requirements:
- Separate multiple items into different objects
- Fix any obvious OCR errors
- Translate dish names to Chinese
- Include prices if present
- Add brief descriptions in both English and Chinese
- For Chinese descriptions, focus on ingredients and cooking method

Return format:
{
  "items": [
    {
      "name": "cleaned up dish name",
      "nameZh": "中文菜名",
      "price": "$XX.XX", // if present
      "descriptionEn": "Brief description of the dish", // optional
      "descriptionZh": "菜品描述（包含主要食材和烹饪方法）" // optional
    }
  ]
}

Return only valid JSON, no other text. [/INST]</s>`,
                    parameters: {
                        max_new_tokens: 1024,
                        temperature: 0.2,
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
                .replace(/```json|```/g, '')
                .trim();
            console.log('Cleaned JSON:', jsonStr)
            
            const parsed = JSON.parse(jsonStr);
            menuItems = parsed.items;
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