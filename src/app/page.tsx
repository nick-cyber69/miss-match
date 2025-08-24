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
        <header className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Miss Match
          </h1>
          <p className="text-gray-600 mt-2">AI-Powered Virtual Fashion Try-On</p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Upload Your Photo</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600">Drag & drop your photo here</p>
              <p className="text-sm text-gray-500 mt-2">or click to browse</p>
            </div>
          </div>
          
          {/* Garments Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Choose Garment</h2>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {garments.map((garment) => (
                <div
                  key={garment.id}
                  onClick={() => setSelectedGarment(garment.id)}
                  className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all transform hover:scale-105 ${
                    selectedGarment === garment.id
                      ? 'border-purple-500 shadow-lg ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="aspect-square relative bg-gray-100">
                    <img
                      src={garment.imageUrl}
                      alt={garment.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 bg-white">
                    <p className="text-sm font-medium truncate">{garment.name}</p>
                    <p className="text-xs text-gray-500">{garment.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Result Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Your result will appear here</p>
              </div>
            </div>
            
            <button
              disabled={!selectedGarment}
              className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-all ${
                selectedGarment
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transform hover:scale-105'
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
