'use client'

import { useState } from 'react'

// Demo garments with actual image URLs
const DEMO_GARMENTS = [
  {
    id: '1',
    name: 'Yellow Plaid Blazer Dress',
    imageUrl: 'https://via.placeholder.com/400x600/ffffff/cccccc?text=Yellow+Plaid',
    category: 'dress',
  },
  {
    id: '2',
    name: 'White T-Shirt',
    imageUrl: 'https://via.placeholder.com/400x600/ffffff/cccccc?text=White+Tee',
    category: 'top',
  },
  {
    id: '3',
    name: 'Denim Jacket',
    imageUrl: 'https://via.placeholder.com/400x600/4169e1/ffffff?text=Denim',
    category: 'top',
  }
]

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const currentGarment = DEMO_GARMENTS[currentGarmentIndex]

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      setShowResult(false) // Reset result when new image selected
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

  // Handle upload/generate
  const handleUpload = async () => {
    if (!selectedFile) {
      // Open file picker if no file selected
      document.getElementById('file-input')?.click()
      return
    }

    // If file is selected, generate the result
    setIsGenerating(true)
    
    // Simulate API call - replace with actual API later
    setTimeout(() => {
      setResultUrl(previewUrl) // For now, just show the original
      setShowResult(true)
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-5xl font-serif italic">Miss Match</h1>
      </div>

      {/* Main Content */}
      <div className="flex justify-center items-center px-8">
        <div className="flex gap-8">
          
          {/* Left Panel - User Photo */}
          <div className="relative w-[480px] h-[640px] bg-[#e5f3f8] rounded-lg overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Your photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Your photo will appear here</p>
              </div>
            )}
          </div>

          {/* Right Panel - Garment */}
          <div className="relative w-[480px] h-[640px] bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={currentGarment.imageUrl}
              alt={currentGarment.name}
              className="w-full h-full object-contain"
            />
            
            {/* Left Arrow */}
            <button
              onClick={previousGarment}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            {/* Right Arrow */}
            <button
              onClick={nextGarment}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Button */}
      <div className="flex justify-center mt-8">
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={handleUpload}
          disabled={isGenerating}
          className="px-16 py-3 bg-white border-2 border-gray-800 rounded-full text-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {isGenerating ? 'Processing...' : 'Upload'}
        </button>
      </div>

      {/* Result Modal */}
      {showResult && resultUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowResult(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img
                src={resultUrl}
                alt="Result"
                className="max-w-full max-h-[70vh] rounded-lg"
              />
              <button
                onClick={() => setShowResult(false)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center"
              >
                ×
              </button>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  // Implement download
                  const link = document.createElement('a')
                  link.href = resultUrl
                  link.download = 'miss-match-result.jpg'
                  link.click()
                }}
                className="px-8 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}