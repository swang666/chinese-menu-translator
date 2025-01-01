'use client'

import { useEffect, useState } from 'react'
import Tesseract from 'tesseract.js'

interface OCRProps {
  imageSrc: string
  onTextExtracted: (text: string) => void
}

export default function OCR({ imageSrc, onTextExtracted }: OCRProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const performOCR = async () => {
      setIsLoading(true)
      try {
        const result = await Tesseract.recognize(imageSrc, 'eng')
        onTextExtracted(result.data.text)
      } catch (error) {
        console.error('OCR Error:', error)
        onTextExtracted('Error extracting text')
      } finally {
        setIsLoading(false)
      }
    }

    performOCR()
  }, [imageSrc, onTextExtracted])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="w-16 h-16 relative">
          <div className="w-16 h-16 border-t-4 border-orange-500 border-solid rounded-full animate-spin"></div>
          <div className="w-8 h-8 absolute top-4 left-4 bg-orange-500 rounded-full animate-pulse"></div>
        </div>
        <span className="mt-2 text-orange-600">正在识别文字 Recognizing text...</span>
      </div>
    )
  }

  return null
}

