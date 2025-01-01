'use client'

import { useEffect, useState } from 'react'

interface FoodDescriptionProps {
  text: string
  onDescription: (description: string) => void
}

// Mock food description function (replace with actual API or database lookup in production)
const mockGetFoodDescription = (text: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // This is a very basic mock. In reality, you'd use a proper database or API.
      resolve(`[食物描述]: 这是一道在美国菜肴中常见的美味佳肴。它由新鲜食材制成，以其独特的风味而闻名。

[Food description]: This is a delicious dish commonly found in American cuisine. It is made with fresh ingredients and is known for its unique flavor profile.`)
    }, 1000)
  })
}

export default function FoodDescription({ text, onDescription }: FoodDescriptionProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getFoodDescription = async () => {
      setIsLoading(true)
      try {
        const description = await mockGetFoodDescription(text)
        onDescription(description)
      } catch (error) {
        console.error('Description Error:', error)
        onDescription('Error getting food description')
      } finally {
        setIsLoading(false)
      }
    }

    getFoodDescription()
  }, [text, onDescription])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping"></div>
          <div className="text-2xl">🍽️</div>
          <div className="w-4 h-4 bg-orange-500 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="mt-2 text-orange-600">正在获取描述 Getting description...</span>
      </div>
    )
  }

  return null
}

