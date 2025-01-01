'use client'

import { useRef, useCallback, useState } from 'react'
import Webcam from 'react-webcam'
import { Button } from "@/components/ui/button"
import { Camera, RotateCcw } from 'lucide-react'

interface CameraProps {
  onCapture: (imageSrc: string) => void
}

export default function CameraComponent({ onCapture }: CameraProps) {
  const webcamRef = useRef<Webcam>(null)
  const [isCameraReady, setIsCameraReady] = useState(false)

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      onCapture(imageSrc)
    }
  }, [onCapture])

  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true)
  }, [])

  return (
    <div className="relative">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: 'environment' }}
        onUserMedia={handleUserMedia}
        className="w-full rounded-lg border-4 border-orange-300"
      />
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <Button 
          onClick={capture} 
          variant="secondary"
          disabled={!isCameraReady}
          className="bg-orange-400 hover:bg-orange-500 text-white absolute bottom-4 left-1/2 transform -translate-x-1/2"
        >
          <Camera className="w-4 h-4 mr-2" />
          拍照 Capture
        </Button>
      </div>
      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-100/80 rounded-lg">
          <RotateCcw className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      )}
    </div>
  )
}

