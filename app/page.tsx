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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  const currentGarment = DEMO_GARMENTS[currentGarmentIndex]

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadedUrl(null) // Reset uploaded URL when new file selected
      setResultUrl(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (data.success) {
        setUploadedUrl(data.url)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerate = async () => {
    if (!uploadedUrl) return
    
    setIsGenerating(true)
    // For now, just show the original image after a delay
    // We'll connect the real API later
    setTimeout(() => {
      setResultUrl(previewUrl)
      setIsGenerating(false)
    }, 2000)
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

      {/* Upload and Generate Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginTop: '40px',
        gap: '20px'
      }}>
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {!uploadedUrl ? (
          // Show Upload button if no file uploaded yet
          <button
            onClick={() => {
              if (selectedFile && !uploadedUrl) {
                handleUpload()
              } else {
                document.getElementById('file-input')?.click()
              }
            }}
            disabled={isUploading}
            style={{
              padding: '12px 50px',
              fontSize: '18px',
              backgroundColor: 'white',
              border: '2px solid #333',
              borderRadius: '30px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: isUploading ? 0.5 : 1
            }}
          >
            {isUploading ? 'Uploading...' : selectedFile ? 'Upload Photo' : 'Choose Photo'}
          </button>
        ) : (
          // Show Generate button after upload
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              padding: '12px 50px',
              fontSize: '18px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              opacity: isGenerating ? 0.5 : 1
            }}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        )}
        
        {/* Change Photo button when photo is uploaded */}
        {uploadedUrl && (
          <button
            onClick={() => {
              setUploadedUrl(null)
              setResultUrl(null)
              document.getElementById('file-input')?.click()
            }}
            style={{
              padding: '12px 30px',
              fontSize: '18px',
              backgroundColor: 'white',
              border: '2px solid #333',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Change Photo
          </button>
        )}
      </div>
      
      {/* Result Display */}
      {resultUrl && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setResultUrl(null)}
        >
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            maxWidth: '90%',
            maxHeight: '90%'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={resultUrl}
              alt="Result"
              style={{ 
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px'
              }}
            />
            <div style={{ 
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              gap: '20px'
            }}>
              <button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = resultUrl
                  link.download = 'miss-match-result.jpg'
                  link.click()
                }}
                style={{
                  padding: '10px 30px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Download
              </button>
              <button
                onClick={() => setResultUrl(null)}
                style={{
                  padding: '10px 30px',
                  backgroundColor: 'white',
                  border: '2px solid #333',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}