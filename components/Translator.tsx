'use client'

import { useEffect, useState } from 'react'

interface TranslatorProps {
  text: string
  onTranslation: (translatedText: string) => void
}

// Mock translation function (replace with actual API in production)
const mockTranslate = (text: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // This is a very basic mock. In reality, you'd use a proper translation API.
      resolve(`[翻译成中文]: ${text}`)
    }, 1000)
  })
}

export default function Translator({ text, onTranslation }: TranslatorProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const translateText = async () => {
      setIsLoading(true)
      try {
        const translatedText = await mockTranslate(text)
        onTranslation(translatedText)
      } catch (error) {
        console.error('Translation Error:', error)
        onTranslation('Error translating text')
      } finally {
        setIsLoading(false)
      }
    }

    translateText()
  }, [text, onTranslation])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="flex space-x-2">
          {['🍣', '🍜', '🍱'].map((emoji, index) => (
            <div key={index} className="text-2xl animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}>
              {emoji}
            </div>
          ))}
        </div>
        <span className="mt-2 text-orange-600">正在翻译 Translating...</span>
      </div>
    )
  }

  return null
}

