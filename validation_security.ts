// src/lib/validation/schemas.ts
import { z } from 'zod';

export const imageUploadSchema = z.object({
  file: z.custom<File>((file) => file instanceof File, 'Must be a file'),
  consent: z.boolean().refine(val => val === true, 'Consent is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
});

export const garmentSelectionSchema = z.object({
  garmentId: z.string().cuid('Invalid garment ID'),
  uploadId: z.string().cuid('Invalid upload ID'),
  options: z.object({
    preserveBackground: z.boolean().default(true),
    quality: z.enum(['standard', 'high', 'ultra']).default('high'),
    style: z.enum(['realistic', 'artistic']).default('realistic'),
  }).optional(),
});

export const tryOnRequestSchema = z.object({
  personImageUrl: z.string().url('Invalid person image URL'),
  garmentImageUrl: z.string().url('Invalid garment image URL'),
  userId: z.string().optional(),
  sessionId: z.string().min(1, 'Session ID required'),
  options: z.object({
    preserveBackground: z.boolean().default(true),
    quality: z.enum(['standard', 'high', 'ultra']).default('high'),
    style: z.enum(['realistic', 'artistic']).default('realistic'),
    fitAdjustment: z.number().min(-1).max(1).default(0),
  }).optional(),
});

// src/lib/validation/image.ts
import sharp from 'sharp';
import ExifParser from 'exif-parser';

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
    hasExif: boolean;
  };
}

export class ImageValidator {
  private static readonly MAX_FILE_SIZE = parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'); // 10MB
  private static readonly SUPPORTED_FORMATS = ['jpeg', 'jpg', 'png', 'webp'];
  private static readonly MIN_DIMENSION = 256;
  private static readonly MAX_DIMENSION = 4096;
  private static readonly MAX_MEGAPIXELS = 25; // 25MP max

  static async validateImage(buffer: Buffer, filename: string): Promise<ImageValidationResult> {
    const errors: string[] = [];

    try {
      // Check file size
      if (buffer.length > this.MAX_FILE_SIZE) {
        errors.push(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      }

      // Use Sharp to get image metadata
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height || !metadata.format) {
        errors.push('Invalid image file');
        return { isValid: false, errors };
      }

      // Check format
      if (!this.SUPPORTED_FORMATS.includes(metadata.format)) {
        errors.push(`Unsupported format. Supported: ${this.SUPPORTED_FORMATS.join(', ')}`);
      }

      // Check dimensions
      if (metadata.width < this.MIN_DIMENSION || metadata.height < this.MIN_DIMENSION) {
        errors.push(`Image too small. Minimum: ${this.MIN_DIMENSION}x${this.MIN_DIMENSION}px`);
      }

      if (metadata.width > this.MAX_DIMENSION || metadata.height > this.MAX_DIMENSION) {
        errors.push(`Image too large. Maximum: ${this.MAX_DIMENSION}x${this.MAX_DIMENSION}px`);
      }

      // Check megapixels
      const megapixels = (metadata.width * metadata.height) / 1000000;
      if (megapixels > this.MAX_MEGAPIXELS) {
        errors.push(`Image resolution too high. Maximum: ${this.MAX_MEGAPIXELS}MP`);
      }

      // Check aspect ratio (should be reasonable for human photos)
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        errors.push('Image aspect ratio should be between 1:3 and 3:1');
      }

      // Check for EXIF data
      let hasExif = false;
      try {
        const exifData = ExifParser.create(buffer).parse();
        hasExif = Object.keys(exifData.tags || {}).length > 0;
      } catch {
        // No EXIF data or parsing failed - that's fine
      }

      return {
        isValid: errors.length === 0,
        errors,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: buffer.length,
          hasExif,
        }
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Failed to process image: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }

  static async stripExifAndOptimize(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .jpeg({ quality: 92, progressive: true }) // Convert to optimized JPEG
      .toBuffer();
  }

  static async createThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
    return sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }
}

// src/lib/validation/nsfw.ts
export interface NSFWResult {
  isNSFW: boolean;
  score: number;
  categories?: Record<string, number>;
}

export class NSFWDetector {
  private static readonly API_KEY = process.env.NSFW_API_KEY;
  private static readonly THRESHOLD = parseFloat(process.env.NSFW_THRESHOLD || '0.7');

  static async checkImage(imageUrl: string): Promise<NSFWResult> {
    if (!this.API_KEY) {
      console.warn('NSFW API key not configured - skipping NSFW check');
      return { isNSFW: false, score: 0 };
    }

    try {
      // Using a hypothetical NSFW detection service
      // Replace with your actual NSFW detection API
      const response = await fetch('https://api.nsfwdetection.com/v1/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: imageUrl,
          categories: ['explicit', 'suggestive', 'safe'],
        }),
      });

      if (!response.ok) {
        throw new Error(`NSFW API error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        isNSFW: result.score > this.THRESHOLD,
        score: result.score,
        categories: result.categories,
      };
    } catch (error) {
      console.error('NSFW detection failed:', error);
      // Fail safe - if we can't check, assume safe but log the issue
      return { isNSFW: false, score: 0 };
    }
  }

  // Alternative: Local NSFW detection using TensorFlow.js
  // This would run locally and not require external API calls
  static async checkImageLocal(buffer: Buffer): Promise<NSFWResult> {
    // Placeholder for local NSFW detection
    // You would implement TensorFlow.js NSFW model here
    
    // For now, return safe
    return { isNSFW: false, score: 0 };
  }
}

// src/lib/auth/clerk.ts (Optional for v1)
import { auth, currentUser } from '@clerk/nextjs/server';

export async function getCurrentUser() {
  try {
    const { userId } = auth();
    if (!userId) return null;

    const user = await currentUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const { userId } = auth();
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}

// For v1 without Clerk, use session-based auth
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSecureId(): string {
  return crypto.randomUUID();
}

export function hashString(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function encryptData(data: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('Encryption key not configured');
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', key);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptData(encryptedData: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('Encryption key not configured');
  
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

export function getExpirationDate(days: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Rate limiting utilities
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();
  
  return {
    check(identifier: string): boolean {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove expired requests
      const validRequests = userRequests.filter(timestamp => now - timestamp < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false;
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      
      return true;
    },
    
    reset(identifier: string): void {
      requests.delete(identifier);
    }
  };
}