'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Camera, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CameraComponent from '../components/Camera'
import { performOCR } from '@/utils/ocr'

export default function Home() {
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [translatedText, setTranslatedText] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<'ocr' | 'translation' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processImage = async (imageSrc: string) => {
    setIsProcessing(true)
    setProcessingStep('ocr')
    setError(null)
    
    try {
      // Perform OCR locally
      const extractedText = await performOCR(imageSrc)
      setExtractedText(extractedText)
      
      // Send only the extracted text for translation
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error)
      }

      setTranslatedText(data.translatedText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setIsProcessing(false)
      setProcessingStep(null)
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
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-center text-orange-600"
      >
        🍽️ 美食翻译 Yummy Translator 🍜
      </motion.h1>

      <Card className="border-orange-300">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {!showCamera && !capturedImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
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
              </motion.div>
            )}

            {showCamera && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CameraComponent onCapture={handleCapture} />
              </motion.div>
            )}

            {capturedImage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <motion.img 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
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
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-4 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
                      <span className="ml-2">
                        {processingStep === 'ocr' 
                          ? '正在识别文字 Detecting text...'
                          : '正在翻译 Translating...'}
                      </span>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-4 p-4 bg-red-50 rounded-lg text-red-600"
                  >
                    {error}
                  </motion.div>
                )}

                {translatedText && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="mt-6 border-orange-200 shadow-lg">
                      <CardHeader className="border-b border-orange-100 bg-orange-50/50">
                        <CardTitle className="text-xl font-semibold text-orange-800">
                          翻译结果 Translation Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ScrollArea className="h-[200px] rounded-md border border-orange-100 bg-white p-4">
                          {extractedText.split('\n').map((line, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                              className="mb-4 last:mb-0"
                            >
                              <p className="text-gray-700 font-mono">
                                {line}
                              </p>
                              <p className="text-orange-600 font-noto-sans-sc mt-1 pl-4 border-l-2 border-orange-200">
                                {translatedText.split('\n')[index]}
                              </p>
                            </motion.div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </main>
  )
}

