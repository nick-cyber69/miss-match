'use client';

import { useState } from 'react';

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          AI Virtual Try-On
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
          Upload your photo and see how any garment looks on you instantly.
        </p>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '2rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            border: '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '2rem',
            backgroundColor: selectedFile ? '#f0f9ff' : '#f9fafb',
            borderColor: selectedFile ? '#3b82f6' : '#d1d5db'
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label 
              htmlFor="file-upload"
              style={{ cursor: 'pointer', display: 'block' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
                <p style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {selectedFile ? selectedFile.name : 'Click to upload your photo'}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  JPEG, PNG, WebP supported
                </p>
              </div>
            </label>
          </div>
          
          {selectedFile && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Continue to Garment Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
