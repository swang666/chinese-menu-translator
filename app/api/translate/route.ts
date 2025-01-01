import { NextResponse } from 'next/server'
import vision from '@google-cloud/vision'
import { Translate } from '@google-cloud/translate/build/src/v2'

// Initialize clients with credentials from environment variables
const visionClient = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID,
  },
})

const translate = new Translate({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    project_id: process.env.GOOGLE_PROJECT_ID,
  },
})

export async function POST(request: Request) {
  // Validate environment variables
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_PROJECT_ID) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    )
  }

  try {
    const { image } = await request.json()

    // Convert base64 image to buffer
    const buffer = Buffer.from(image.split(',')[1], 'base64')

    // Perform OCR
    const [result] = await visionClient.textDetection(buffer)
    const detections = result.textAnnotations
    const extractedText = detections?.[0]?.description || ''

    // Translate the text
    const [translation] = await translate.translate(extractedText, {
      from: 'en',
      to: 'zh'
    })

    return NextResponse.json({ 
      success: true, 
      extractedText,
      translatedText: translation 
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process image' },
      { status: 500 }
    )
  }
} 