'use client'

import { useState } from 'react'
import Image from 'next/image'

// Demo garments - temporary until we connect to database
const DEMO_GARMENTS = [
  {
    id: '1',
    name: 'Classic White T-Shirt',
    imageUrl: 'https://via.placeholder.com/400x600/ffffff/cccccc?text=White+T-Shirt',
    category: 'top',
    sku: 'WT001'
  },
  {
    id: '2', 
    name: 'Yellow Plaid Blazer',
    imageUrl: 'https://via.placeholder.com/400x600/ffeb3b/000000?text=Yellow+Blazer',
    category: 'top',
    sku: 'YB002'
  },
  {
    id: '3',
    name: 'Denim Shorts',
    imageUrl: 'https://via.placeholder.com/400x600/2196f3/ffffff?text=Denim+Shorts', 
    category: 'bottom',
    sku: 'DS003'
  }
]

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0)
  const [consent, setConsent] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null)

  const currentGarment = DEMO_GARMENTS[currentGarmentIndex]

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Navigate garments
  const previousGarment = () => {
    setCurrentGarmentIndex((prev) => 
      prev === 0 ? DEMO_GARMENTS.length - 1 : prev - 1
    )
  }

  const nextGarment = () => {
    setCurrentGarmentIndex((prev) => 
      prev === DEMO_GARMENTS.length - 1 ? 0 : prev + 1
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-8">
      {/* Header - Simple centered text */}
      <h1 className="text-5xl font-serif italic mb-12">Miss Match</h1>

      {/* Main Content - Two panels side by side */}
      <div className="flex gap-8 max-w-6xl mx-auto px-4">
        
        {/* Left Panel - User Photo */}
        <div className="flex flex-col items-center">
          <div className="w-[400px] h-[600px] bg-[#e8f4f8] rounded-2xl flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Your photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <p>Your photo will appear here</p>
              </div>
            )}
          </div>
          
          {/* Upload Button */}
          <label className="mt-6">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="px-12 py-3 bg-white border-2 border-gray-800 rounded-full cursor-pointer hover:bg-gray-50 transition-colors">
              <span className="text-lg font-medium">Upload</span>
            </div>
          </label>
        </div>

        {/* Right Panel - Garment */}
        <div className="flex flex-col items-center">
          <div className="w-[400px] h-[600px] bg-[#f0f0f0] rounded-2xl relative flex items-center justify-center overflow-hidden">
            <img
              src={currentGarment.imageUrl}
              alt={currentGarment.name}
              className="w-full h-full object-contain p-8"
            />
            
            {/* Navigation Arrows */}
            <button
              onClick={previousGarment}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextGarment}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Garment Name */}
          <p className="mt-4 text-lg">{currentGarment.name}</p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-8 flex flex-col items-center gap-4">
        {/* Consent Checkbox */}
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-4 h-4"
          />
          I own this photo and consent to processing
        </label>

        {/* Generate Button */}
        <button
          onClick={() => {
            // We'll implement this next
            console.log('Generate clicked')
          }}
          disabled={!selectedFile || !consent}
          className="px-12 py-3 bg-black text-white rounded-full font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          Generate
        </button>
      </div>
    </div>
  )
}