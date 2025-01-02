import { NextResponse } from 'next/server'

async function translateText(text: string) {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`
    )
    const data = await response.json()
    return data.responseData.translatedText
  } catch (error) {
    console.error('Translation error:', error)
    throw new Error('Translation failed')
  }
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    console.log('Received text for translation:', text);
    
    const translatedText = await translateText(text)
    console.log('Translation result:', translatedText);

    return NextResponse.json({ 
      success: true, 
      translatedText 
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to translate text'
      },
      { status: 500 }
    )
  }
} 