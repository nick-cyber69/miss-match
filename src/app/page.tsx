'use client';

import { useState } from 'react';

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [step, setStep] = useState<'upload' | 'garment' | 'result'>('upload');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleContinue = () => {
    setStep('garment');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Progress indicator */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          {['Upload', 'Garment', 'Result'].map((stepName, index) => (
            <div key={stepName} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: index === 0 ? '#3b82f6' : '#e5e7eb',
                color: index === 0 ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {index + 1}
              </div>
              {index < 2 && (
                <div style={{
                  width: '60px',
                  height: '2px',
                  backgroundColor: '#e5e7eb',
                  margin: '0 0.5rem'
                }} />
              )}
            </div>
          ))}
        </div>
        <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>Upload Photo</p>
      </div>

      {/* Main content */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          color: '#111827'
        }}>
          AI Virtual Try-On
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#6b7280',
          marginBottom: '3rem'
        }}>
          Upload your photo and see how any garment looks on you instantly.
        </p>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            border: selectedFile ? '2px dashed #3b82f6' : '2px dashed #d1d5db',
            borderRadius: '8px',
            padding: '3rem 2rem',
            backgroundColor: selectedFile ? '#eff6ff' : '#f9fafb',
            transition: 'all 0.2s ease'
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
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                  {selectedFile ? '✅' : '📸'}
                </div>
                <p style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600',
                  color: selectedFile ? '#1e40af' : '#374151',
                  marginBottom: '0.5rem'
                }}>
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to upload your photo'}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  JPEG, PNG, WebP supported • Max 10MB
                </p>
                {selectedFile && (
                  <p style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem' }}>
                    File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </label>
          </div>
          
          {selectedFile && (
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button 
                onClick={handleContinue}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.875rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Continue to Garment Selection →
              </button>
            </div>
          )}
        </div>

        {step === 'garment' && (
          <div style={{
            marginTop: '2rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
              Choose a Garment
            </h3>
            <p style={{ color: '#6b7280' }}>
              Garment library coming soon! Your photo "{selectedFile?.name}" is ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
