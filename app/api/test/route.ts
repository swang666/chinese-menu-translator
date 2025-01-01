import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    configured: !!(process.env.GOOGLE_CLIENT_EMAIL && 
                  process.env.GOOGLE_PRIVATE_KEY && 
                  process.env.GOOGLE_PROJECT_ID)
  })
} 