'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { performOCR } from '@/utils/ocr'
import { compressImage } from '@/utils/imageProcessing'
import { MenuItem } from '@/app/api/parse-menu/route'

export default function Home() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [compressedDisplayImage, setCompressedDisplayImage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<'ocr' | 'parsing' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processImage = async (imageSrc: string) => {
    setIsProcessing(true)
    setProcessingStep('ocr')
    setError(null)
    
    try {
      // Compress image before processing
      console.log('Compressing image...')
      const compressedImage = await compressImage(imageSrc)
      console.log('Image compressed')
      
      // Perform OCR on compressed image
      const extractedText = await performOCR(compressedImage)
      setExtractedText(extractedText)
      
      // Parse menu and translate
      setProcessingStep('parsing')
      const parseResponse = await fetch('/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          englishText: extractedText
        }),
      })

      const parseData = await parseResponse.json()
      
      if (!parseData.success) {
        throw new Error(parseData.error)
      }

      setMenuItems(parseData.menuItems)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setIsProcessing(false)
      setProcessingStep(null)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const imageSrc = reader.result as string
        setCapturedImage(imageSrc)
        // Compress image for display
        const compressed = await compressImage(imageSrc)
        setCompressedDisplayImage(compressed)
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
        className="text-3xl font-bold mb-2 text-center text-orange-600"
      >
        🍽️ 吃在美国 🍜
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-6 text-gray-600"
      >
        <span className="font-noto-sans-sc block mb-1">
          拍摄菜单照片，即可获得中文翻译
        </span>
      </motion.p>

      <Card className="border-orange-300">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {!capturedImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                <Button 
                  variant="outline" 
                  className="border-orange-500 text-orange-500 hover:bg-orange-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  拍照 Take Photo
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

            {capturedImage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <motion.img 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  src={compressedDisplayImage || capturedImage} 
                  alt="Captured menu" 
                  className="w-full rounded-lg border-2 border-orange-300" 
                />
                <Button 
                  onClick={() => {
                    setCapturedImage(null)
                    setExtractedText('')
                    setMenuItems([])
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
                        {processingStep === 'ocr' && '正在识别文字 Detecting text...'}
                        {processingStep === 'parsing' && '正在分析菜单 Analyzing menu...'}
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

                {menuItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="mt-6 border-orange-200 shadow-lg">
                      <CardHeader className="border-b border-orange-100 bg-orange-50/50">
                        <CardTitle className="text-xl font-semibold text-orange-800">
                          菜单项目 Menu Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ScrollArea className="h-[400px] rounded-md border border-orange-100 bg-white p-4">
                          {menuItems.map((item, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index }}
                              className="mb-6 last:mb-0"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-800">
                                    {item.name}
                                  </h3>
                                  <p className="text-lg font-noto-sans-sc text-orange-600 mt-1">
                                    {item.nameZh}
                                  </p>
                                  {(item.descriptionEn || item.descriptionZh) && (
                                    <div className="mt-2 text-sm">
                                      {item.descriptionEn && (
                                        <p className="text-gray-600 italic">
                                          {item.descriptionEn}
                                        </p>
                                      )}
                                      {item.descriptionZh && (
                                        <p className="font-noto-sans-sc text-gray-600 mt-1">
                                          {item.descriptionZh}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {item.price && (
                                  <span className="text-lg font-mono text-green-600 ml-4">
                                    {item.price}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 h-px bg-orange-100" />
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

