'use client'

import { useState } from 'react'

const DEMO_GARMENTS = [
  {
    id: '1',
    name: 'Yellow Plaid Blazer Dress',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkdhcm1lbnQgMTwvdGV4dD48L3N2Zz4=',
  },
  {
    id: '2',
    name: 'White T-Shirt',
    imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkdhcm1lbnQgMjwvdGV4dD48L3N2Zz4=',
  },
]

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0)

  const currentGarment = DEMO_GARMENTS[currentGarmentIndex]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const previousGarment = () => {
    setCurrentGarmentIndex(prev => prev === 0 ? DEMO_GARMENTS.length - 1 : prev - 1)
  }

  const nextGarment = () => {
    setCurrentGarmentIndex(prev => prev === DEMO_GARMENTS.length - 1 ? 0 : prev + 1)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h1 style={{ 
          fontSize: '48px', 
          fontStyle: 'italic',
          fontFamily: 'serif',
          margin: 0
        }}>
          Miss Match
        </h1>
      </div>

      {/* Main Panels */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        gap: '30px',
        padding: '0 20px'
      }}>
        {/* Left Panel - User Photo */}
        <div style={{
          width: '450px',
          height: '600px',
          backgroundColor: '#e8f4f8',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Your photo"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }}
            />
          ) : (
            <p style={{ color: '#999' }}>Your photo will appear here</p>
          )}
        </div>

        {/* Right Panel - Garment */}
        <div style={{
          width: '450px',
          height: '600px',
          backgroundColor: '#f5f5f5',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <img 
            src={currentGarment.imageUrl}
            alt={currentGarment.name}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              padding: '20px'
            }}
          />
          
          {/* Left Arrow */}
          <button
            onClick={previousGarment}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            ‹
          </button>
          
          {/* Right Arrow */}
          <button
            onClick={nextGarment}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Upload Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginTop: '40px'
      }}>
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => document.getElementById('file-input')?.click()}
          style={{
            padding: '12px 50px',
            fontSize: '18px',
            backgroundColor: 'white',
            border: '2px solid #333',
            borderRadius: '30px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Upload
        </button>
      </div>
    </div>
  )
}