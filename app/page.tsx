'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react'

// Demo garments - we'll move these to a database later
const DEMO_GARMENTS = [
  {
    id: '1',
    name: 'Classic White T-Shirt',
    imageUrl: '/garments/white-tshirt.jpg',
    category: 'top',
    sku: 'WT001'
  },
  {
    id: '2', 
    name: 'Yellow Plaid Blazer',
    imageUrl: '/garments/yellow-blazer.jpg',
    category: 'top',
    sku: 'YB002'
  },
  {
    id: '3',
    name: 'Denim Shorts',
    imageUrl: '/garments/denim-shorts.jpg', 
    category: 'bottom',
    sku: 'DS003'
  },
  {
    id: '4',
    name: 'Summer Dress',
    imageUrl: '/garments/summer-dress.jpg',
    category: 'dress',
    sku: 'SD004'
  },
  {
    id: '5',
    name: 'Black Jeans',
    imageUrl: '/garments/black-jeans.jpg',
    category: 'bottom',
    sku: 'BJ005'
  },
  {
    id: '6',
    name: 'Floral Top',
    imageUrl: '/garments/floral-top.jpg',
    category: 'top',
    sku: 'FT006'
  }
]

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0)
  const [consent, setConsent] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const currentGarment = DEMO_GARMENTS[currentGarmentIndex]

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        setError('Please select a JPEG or PNG image')
        return
      }
      
      setSelectedFile(file)
      setError(null)
      
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

  // Handle generation
  const handleGenerate = async () => {
    if (!selectedFile || !consent) return

    setIsGenerating(true)
    setError(null)

    try {
      // Step 1: Get upload URL
      const uploadResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filename: selectedFile.name,
          contentType: selectedFile.type 
        })
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, publicUrl } = await uploadResponse.json()

      // Step 2: Upload file to Blob storage
      const uploadResult = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        }
      })

      if (!uploadResult.ok) {
        throw new Error('Failed to upload image')
      }

      // Step 3: Call try-on API
      const tryOnResponse = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalImageUrl: publicUrl,
          garmentId: currentGarment.id,
          consent: true
        })
      })

      if (!tryOnResponse.ok) {
        throw new Error('Failed to generate try-on')
      }

      const { renderUrl } = await tryOnResponse.json()
      setResultImageUrl(renderUrl)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle download
  const handleDownload = async () => {
    if (!resultImageUrl) return
    
    const link = document.createElement('a')
    link.href = resultImageUrl
    link.download = 'miss-match-result.jpg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="py-8 text-center">
        <h1 className="text-4xl font-bold tracking-wide">Miss Match</h1>
        <p className="text-gray-600 mt-2">AI-Powered Virtual Fashion Try-On</p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* Left Column - Upload */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden aspect-[3/4]">
              {resultImageUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={resultImageUrl}
                    alt="Generated result"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : previewUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={previewUrl}
                    alt="Your photo"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                  <Upload className="w-12 h-12 mb-4" />
                  <p className="text-center">Your photo will appear here</p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <label className="block">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isGenerating}
              />
              <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium text-center cursor-pointer hover:bg-blue-700 transition-colors">
                <Upload className="inline-block w-5 h-5 mr-2" />
                {selectedFile ? 'Change Photo' : 'Upload Photo'}
              </div>
            </label>

            {/* Consent Checkbox */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
                disabled={isGenerating}
              />
              <label htmlFor="consent" className="text-sm text-gray-600">
                I own this photo and consent to processing
              </label>
            </div>
          </div>

          {/* Right Column - Garment Selection */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden aspect-[3/4] relative">
              <div className="relative w-full h-full p-4">
                <Image
                  src={currentGarment.imageUrl}
                  alt={currentGarment.name}
                  fill
                  className="object-contain"
                />
              </div>
              
              {/* Navigation Arrows */}
              <button
                onClick={previousGarment}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
                disabled={isGenerating}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextGarment}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
                disabled={isGenerating}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Garment Name */}
            <div className="text-center">
              <h3 className="font-medium text-lg">{currentGarment.name}</h3>
              <p className="text-sm text-gray-500">SKU: {currentGarment.sku}</p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedFile || !consent || isGenerating}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>

            {/* Download Button */}
            {resultImageUrl && (
              <button
                onClick={handleDownload}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                <Download className="inline-block w-5 h-5 mr-2" />
                Download Result
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}