// src/components/ui/button.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// src/components/forms/ConsentForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ConsentFormProps {
  onConsent: (consented: boolean) => void;
  loading?: boolean;
}

export function ConsentForm({ onConsent, loading }: ConsentFormProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border shadow-sm">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Terms of Use & Privacy</h3>
        
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            By using Miss Match, you agree to the following terms:
          </p>
          
          <ul className="space-y-2 list-disc list-inside">
            <li>You have the right to use the uploaded image</li>
            <li>Images are processed using AI and may not be perfect</li>
            <li>Results are for personal, non-commercial use only</li>
            <li>Images are automatically deleted after 30 days</li>
            <li>We do not store or share your personal data</li>
            <li>NSFW content will be automatically rejected</li>
          </ul>

          <p className="text-xs">
            <strong>Privacy:</strong> Your images are processed securely and deleted automatically. 
            We use industry-standard encryption and do not share your data with third parties.
          </p>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="consent"
            checked={agreed}
            onCheckedChange={setAgreed}
            className="mt-1"
          />
          <label 
            htmlFor="consent" 
            className="text-sm text-gray-700 cursor-pointer leading-5"
          >
            I agree to the terms of use and privacy policy. I confirm that I have 
            the right to use the uploaded image and consent to AI processing.
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => onConsent(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onConsent(true)}
          disabled={!agreed || loading}
          className="min-w-[100px]"
        >
          I Agree
        </Button>
      </div>
    </div>
  );
}

// src/components/forms/ImageUpload.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsentForm } from './ConsentForm';
import { formatFileSize } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/constants';

interface ImageUploadProps {
  onUploadComplete: (upload: any) => void;
  sessionId: string;
}

export function ImageUpload({ onUploadComplete, sessionId }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: APP_CONFIG.MAX_UPLOAD_SIZE,
    multiple: false,
  });

  const handleConsent = async (consented: boolean) => {
    if (!consented || !selectedFile) {
      setShowConsent(false);
      setSelectedFile(null);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('consent', 'true');
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onUploadComplete(result.upload);
      setSelectedFile(null);
      setShowConsent(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (showConsent) {
    return <ConsentForm onConsent={handleConsent} loading={uploading} />;
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${selectedFile ? 'border-green-400 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="space-y-3">
            <ImageIcon className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="font-medium text-green-700">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <p className="text-lg font-medium">Upload your photo</p>
              <p className="text-gray-500">
                Drag & drop or click to select
              </p>
              <p className="text-sm text-gray-400 mt-2">
                JPEG, PNG, WebP • Max {formatFileSize(APP_CONFIG.MAX_UPLOAD_SIZE)}
              </p>
            </div>
          </div>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{file.name}: {errors[0]?.message}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && !showConsent && (
        <Button
          onClick={() => setShowConsent(true)}
          className="w-full"
          disabled={uploading}
        >
          Continue
        </Button>
      )}
    </div>
  );
}

// src/components/forms/GarmentSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

interface GarmentSelectorProps {
  onSelect: (garment: Garment) => void;
  selectedGarment?: Garment;
  disabled?: boolean;
}

export function GarmentSelector({ onSelect, selectedGarment, disabled }: GarmentSelectorProps) {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categories = ['TOPS', 'BOTTOMS', 'DRESSES', 'OUTERWEAR', 'ACCESSORIES'];

  useEffect(() => {
    fetchGarments(true);
  }, [category, search]);

  const fetchGarments = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(category && { category }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/garments?${params}`);
      const data = await response.json();

      if (reset) {
        setGarments(data.garments);
        setPage(1);
      } else {
        setGarments(prev => [...prev, ...data.garments]);
      }

      setHasMore(currentPage < data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch garments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    fetchGarments(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Choose a Garment</h3>
        
        {/* Search and filters */}
        <div className="flex space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search garments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Garment grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {garments.map((garment) => (
          <div
            key={garment.id}
            className={`
              border rounded-lg overflow-hidden cursor-pointer transition-all
              ${selectedGarment?.id === garment.id 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'border-gray-200 hover:border-gray-300'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !disabled && onSelect(garment)}
          >
            <div className="aspect-square bg-gray-100">
              <img
                src={garment.thumbnailUrl || garment.imageUrl}
                alt={garment.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-3 space-y-1">
              <h4 className="font-medium text-sm truncate">{garment.name}</h4>
              {garment.brand && (
                <p className="text-xs text-gray-500">{garment.brand}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {garment.category.toLowerCase()}
                </span>
                {garment.color && (
                  <span className="text-xs text-gray-500">{garment.color}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && garments.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && garments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No garments found</p>
          {(search || category) && (
            <Button
              variant="link"
              onClick={() => {
                setSearch('');
                setCategory('');
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {hasMore && !loading && garments.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// src/components/gallery/ResultGallery.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, Share2, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TryOnResult {
  id: string;
  status: string;
  resultUrl?: string;
  thumbnailUrl?: string;
  processingTime?: number;
  errorMessage?: string;
  createdAt: string;
  upload: {
    id: string;
    thumbnailUrl: string;
  };
  garment: {
    id: string;
    name: string;
    thumbnailUrl: string;
  };
}

interface ResultGalleryProps {
  resultId: string;
  onComplete?: (result: TryOnResult) => void;
}

export function ResultGallery({ resultId, onComplete }: ResultGalleryProps) {
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (resultId) {
      fetchResult();
      startPolling();
    }
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await fetch(`/api/tryon/status/${resultId}`);
      const data = await response.json();
      
      setResult(data);
      
      if (data.status === 'COMPLETED' || data.status === 'FAILED') {
        setPolling(false);
        onComplete?.(data);
      }
    } catch (error) {
      console.error('Failed to fetch result:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tryon/status/${resultId}`);
        const data = await response.json();
        
        setResult(data);
        
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(interval);
          setPolling(false);
          onComplete?.(data);
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(interval);
        setPolling(false);
      }
    }, 3000); // Poll every 3 seconds

    // Clear interval after 10 minutes
    setTimeout(() => {
      clearInterval(interval);
      setPolling(false);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  };

  const downloadResult = () => {
    if (result?.resultUrl) {
      const link = document.createElement('a');
      link.href = result.resultUrl;
      link.download = `miss-match-result-${result.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareResult = async () => {
    if (result?.resultUrl && navigator.share) {
      try {
        await navigator.share({
          title: 'Miss Match Virtual Try-On Result',
          url: result.resultUrl,
        });
      } catch (error) {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(result.resultUrl);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Result not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {result.status === 'COMPLETED' && (
            <>
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">Completed</span>
            </>
          )}
          {result.status === 'PROCESSING' && (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-blue-700 font-medium">Processing...</span>
            </>
          )}
          {result.status === 'QUEUED' && (
            <>
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-700 font-medium">Queued</span>
            </>
          )}
          {result.status === 'FAILED' && (
            <>
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 font-medium">Failed</span>
            </>
          )}
        </div>

        {polling && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Checking status...</span>
          </div>
        )}
      </div>

      {/* Result grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Original image */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Original</h4>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={result.upload.thumbnailUrl}
              alt="Original"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Garment */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Garment</h4>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={result.garment.thumbnailUrl}
              alt={result.garment.name}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-center text-gray-600">{result.garment.name}</p>
        </div>

        {/* Result */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Result</h4>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {result.status === 'COMPLETED' && result.thumbnailUrl ? (
              <img
                src={result.thumbnailUrl}
                alt="Try-on result"
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => result.resultUrl && window.open(result.resultUrl, '_blank')}
              />
            ) : result.status === 'PROCESSING' || result.status === 'QUEUED' ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-500">
                    {result.status === 'PROCESSING' ? 'Processing...' : 'In queue...'}
                  </p>
                </div>
              </div>
            ) : result.status === 'FAILED' ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <XCircle className="w-8 h-8 text-red-400 mx-auto" />
                  <p className="text-sm text-red-600">
                    {result.errorMessage || 'Processing failed'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-500">Waiting...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {result.status === 'COMPLETED' && result.resultUrl && (
        <div className="flex justify-center space-x-3">
          <Button onClick={downloadResult} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {navigator.share && (
            <Button onClick={shareResult} variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
        </div>
      )}

      {/* Processing info */}
      {result.processingTime && (
        <div className="text-center text-sm text-gray-500">
          Processed in {Math.round(result.processingTime / 1000)}s
        </div>
      )}
    </div>
  );
}