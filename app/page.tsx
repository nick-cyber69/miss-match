'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [garments, setGarments] = useState<any[]>([])
  const [selectedGarment, setSelectedGarment] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/garments')
      .then(res => res.json())
      .then(data => setGarments(data.garments || []))
      .catch(err => console.error('Failed to load garments:', err))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center mb-8 pt-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Miss Match
          </h1>
          <p className="text-gray-600 mt-2">AI-Powered Virtual Fashion Try-On</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Your Photo</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray-600 text-sm">Drag & drop your photo here</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
            </div>
          </div>
          
          {/* Garments Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Choose Garment</h2>
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {garments.map((garment) => (
                <div
                  key={garment.id}
                  onClick={() => setSelectedGarment(garment.id)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedGarment === garment.id
                      ? 'border-purple-500 shadow-md'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <img
                    src={garment.imageUrl}
                    alt={garment.name}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-1 bg-white">
                    <p className="text-xs font-medium truncate">{garment.name}</p>
                    <p className="text-xs text-gray-500">{garment.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Result Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Result</h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center mb-4">
              <div className="text-4xl mb-2">✨</div>
              <p className="text-gray-500 text-sm">Your result will appear here</p>
            </div>
            
            <button
              disabled={!selectedGarment}
              className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                selectedGarment
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {selectedGarment ? '✨ Generate Look' : 'Select a garment first'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
