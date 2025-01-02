import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.HUGGINGFACE_API_KEY

  // Test the API key with a simple request
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: "Hello, are you working?",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return NextResponse.json({ 
      success: true, 
      apiKeyConfigured: !!apiKey,
      apiWorking: true
    })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      success: false, 
      apiKeyConfigured: !!apiKey,
      error: error instanceof Error ? error.message : 'Test failed'
    })
  }
} 