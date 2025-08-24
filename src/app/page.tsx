'use client'

import { useState, useEffect } from 'react'
import { ImageUploader } from '@/components/image-uploader'

export default function HomePage() {
  const [garments, setGarments] = useState<any[]>([])
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null)

  useEffect(() => {
    // Fetch garments when page loads
    fetch('/api/garments')
      .then(res => res.json())
      .then(data => setGarments(data.garments || []))
      .catch(err => console.error('Failed to load garments:', err))
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Miss Match
        </h1>
        <p className="text-gray-600 mt-2">AI-Powered Virtual Fashion Try-On</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div>
          <ImageUploader />
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Choose Garment</h2>
          <div className="grid grid-cols-2 gap-3">
            {garments.map((garment) => (
              <div
                key={garment.id}
                onClick={() => setSelectedGarment(garment.id)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  selectedGarment === garment.id
                    ? 'border-purple-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={garment.imageUrl}
                  alt={garment.name}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{garment.name}</p>
                  <p className="text-xs text-gray-500">{garment.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <p className="text-gray-500">Coming soon...</p>
        </div>
      </div>
    </div>
  )
}
