// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Miss Match - AI Virtual Try-On',
  description: 'Upload your photo and try on clothes with AI. See how garments look on you instantly.',
  keywords: 'virtual try-on, AI fashion, clothing preview, virtual fitting room',
  authors: [{ name: 'Miss Match Team' }],
  openGraph: {
    title: 'Miss Match - AI Virtual Try-On',
    description: 'Upload your photo and try on clothes with AI',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Miss Match - AI Virtual Try-On',
    description: 'Upload your photo and try on clothes with AI',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MM</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-900">Miss Match</h1>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                  <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Try-On
                  </a>
                  <a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                    About
                  </a>
                  <a href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Privacy
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main>{children}</main>

          {/* Footer */}
          <footer className="bg-white border-t mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">MM</span>
                    </div>
                    <span className="font-semibold">Miss Match</span>
                  </div>
                  <p className="text-gray-600 text-sm">
                    AI-powered virtual try-on for fashion. See how clothes look on you instantly.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Instant try-on results</li>
                    <li>✓ Preserve background</li>
                    <li>✓ Privacy-focused</li>
                    <li>✓ Auto-delete after 30 days</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Legal</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><a href="/privacy" className="hover:text-gray-900">Privacy Policy</a></li>
                    <li><a href="/terms" className="hover:text-gray-900">Terms of Service</a></li>
                    <li><a href="/contact" className="hover:text-gray-900">Contact</a></li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t pt-6 mt-6 text-center text-sm text-gray-500">
                © 2025 Miss Match. All rights reserved. Images are automatically deleted after 30 days.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/forms/ImageUpload';
import { GarmentSelector } from '@/components/forms/GarmentSelector';
import { ResultGallery } from '@/components/gallery/ResultGallery';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { generateSecureId } from '@/lib/utils';

interface Upload {
  id: string;
  url: string;
  thumbnailUrl: string;
  status: string;
  fileName: string;
}

interface Garment {
  id: string;
  name: string;
  description?: string;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  brand?: string;
  color?: string;
}

type Step = 'upload' | 'garment' | 'processing' | 'result';

export default function HomePage() {
  const [step, setStep] = useState<Step>('upload');
  const [sessionId] = useState(() => generateSecureId());
  const [upload, setUpload] = useState<Upload | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (uploadData: Upload) => {
    setUpload(uploadData);
    setStep('garment');
    setError(null);
  };

  const handleGarmentSelect = (garment: Garment) => {
    setSelectedGarment(garment);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!upload || !selectedGarment) return;

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tryon/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId: upload.id,
          garmentId: selectedGarment.id,
          sessionId,
          options: {
            preserveBackground: true,
            quality: 'high',
            style: 'realistic',
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Generation failed');
      }

      setResultId(result.resultId);
      setStep('processing');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleResultComplete = () => {
    setStep('result');
  };

  const handleStartOver = () => {
    setStep('upload');
    setUpload(null);
    setSelectedGarment(null);
    setResultId(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero section - show only on upload step */}
      {step === 'upload' && (
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Virtual Try-On
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Upload your photo and see how any garment looks on you instantly. 
            Our AI preserves your background while giving you realistic try-on results.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="font-semibold mb-2">Upload Photo</h3>
              <p className="text-sm text-gray-600">Upload any full-body photo of yourself</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👗</span>
              </div>
              <h3 className="font-semibold mb-2">Choose Garment</h3>
              <p className="text-sm text-gray-600">Browse our library of clothing items</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold mb-2">AI Magic</h3>
              <p className="text-sm text-gray-600">Get realistic results in seconds</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {['upload', 'garment', 'processing', 'result'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${['upload', 'garment', 'processing', 'result'].indexOf(step) >= index
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'}
                `}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`
                    w-16 h-0.5 mx-2
                    ${['upload', 'garment', 'processing', 'result'].indexOf(step) > index
                      ? 'bg-blue-500'
                      : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center mt-3">
          <span className="text-sm text-gray-600 capitalize">
            {step === 'processing' ? 'Processing' : 
             step === 'garment' ? 'Select Garment' :
             step === 'result' ? 'Result Ready' : 'Upload Photo'}
          </span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Step content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {step === 'upload' && (
          <ImageUpload onUploadComplete={handleUploadComplete} sessionId={sessionId} />
        )}

        {step === 'garment' && (
          <div className="space-y-6">
            <GarmentSelector
              onSelect={handleGarmentSelect}
              selectedGarment={selectedGarment}
              disabled={generating}
            />
            
            {selectedGarment && (
              <div className="flex justify-center pt-4 border-t">
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Try-On
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {(step === 'processing' || step === 'result') && resultId && (
          <div className="space-y-6">
            <ResultGallery
              resultId={resultId}
              onComplete={handleResultComplete}
            />
            
            {step === 'result' && (
              <div className="text-center pt-4 border-t">
                <Button
                  onClick={handleStartOver}
                  variant="outline"
                  size="lg"
                >
                  Try Another Look
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Additional info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          🔒 Your images are processed securely and automatically deleted after 30 days.
          <br />
          ⚡ Processing typically takes 30-60 seconds.
        </p>
      </div>
    </div>
  );
}

// src/app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

/* Image upload dropzone animations */
.dropzone-active {
  @apply border-blue-400 bg-blue-50;
  animation: pulse 2s infinite;
}

/* Loading skeleton */
.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

/* Responsive image containers */
.aspect-square {
  aspect-ratio: 1 / 1;
}

.aspect-photo {
  aspect-ratio: 3 / 4;
}
    