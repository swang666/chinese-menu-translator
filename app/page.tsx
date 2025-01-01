'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Upload } from 'lucide-react'
import CameraComponent from '../components/Camera'

export default function Home() {
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [translatedText, setTranslatedText] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processImage = async (imageSrc: string) => {
    setIsProcessing(true)
    setError(null)
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageSrc }),
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }

      setExtractedText(data.extractedText)
      setTranslatedText(data.translatedText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc)
    setShowCamera(false)
    processImage(imageSrc)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageSrc = reader.result as string
        setCapturedImage(imageSrc)
        processImage(imageSrc)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <main className="container mx-auto p-4 max-w-md min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange-600">
        🍽️ 美食翻译 Yummy Translator 🍜
      </h1>

      <Card className="border-orange-300">
        <CardContent className="p-6">
          {!showCamera && !capturedImage && (
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => setShowCamera(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Camera className="w-4 h-4 mr-2" />
                拍照 Take Photo
              </Button>
              <Button 
                variant="outline" 
                className="border-orange-500 text-orange-500 hover:bg-orange-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                上传图片 Upload Image
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </div>
          )}

          {showCamera && (
            <CameraComponent onCapture={handleCapture} />
          )}

          {capturedImage && (
            <div className="space-y-4">
              <img 
                src={capturedImage} 
                alt="Captured menu" 
                className="w-full rounded-lg border-2 border-orange-300" 
              />
              <Button 
                onClick={() => {
                  setCapturedImage(null)
                  setExtractedText('')
                  setTranslatedText('')
                  setError(null)
                }}
                variant="outline"
                className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
              >
                重新拍照 Take Another Photo
              </Button>
              
              {isProcessing && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                    <span className="ml-2">Processing image...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              {translatedText && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-semibold mb-2">翻译 Translation:</h3>
                  <p className="whitespace-pre-wrap">{translatedText}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

