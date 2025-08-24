// src/lib/storage/blob.ts
import { put, del, list } from '@vercel/blob';
import { sanitizeFilename, generateSecureId } from '../utils';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

export class BlobStorage {
  private static readonly FOLDER_STRUCTURE = {
    uploads: 'uploads',
    thumbnails: 'thumbnails', 
    results: 'results',
    garments: 'garments',
  } as const;

  static async uploadImage(
    buffer: Buffer,
    originalFilename: string,
    contentType: string,
    folder: keyof typeof BlobStorage.FOLDER_STRUCTURE = 'uploads'
  ): Promise<UploadResult> {
    try {
      const fileExtension = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
      const sanitizedName = sanitizeFilename(originalFilename.replace(/\.[^/.]+$/, ''));
      const uniqueId = generateSecureId();
      const filename = `${this.FOLDER_STRUCTURE[folder]}/${uniqueId}-${sanitizedName}.${fileExtension}`;

      const { url } = await put(filename, buffer, {
        contentType,
        access: 'public',
        addRandomSuffix: false,
      });

      return {
        url,
        filename,
        size: buffer.length,
        contentType,
      };
    } catch (error) {
      console.error('Blob upload failed:', error);
      throw new Error('Failed to upload image to storage');
    }
  }

  static async uploadFromUrl(
    imageUrl: string,
    filename: string,
    folder: keyof typeof BlobStorage.FOLDER_STRUCTURE = 'results'
  ): Promise<UploadResult> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return await this.uploadImage(buffer, filename, contentType, folder);
    } catch (error) {
      console.error('Upload from URL failed:', error);
      throw new Error('Failed to download and upload image');
    }
  }

  static async deleteImage(url: string): Promise<boolean> {
    try {
      await del(url);
      return true;
    } catch (error) {
      console.error('Blob deletion failed:', error);
      return false;
    }
  }

  static async deleteMultiple(urls: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    // Delete in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const promises = batch.map(async (url) => {
        try {
          await del(url);
          success.push(url);
        } catch (error) {
          console.error(`Failed to delete ${url}:`, error);
          failed.push(url);
        }
      });

      await Promise.all(promises);
    }

    return { success, failed };
  }

  static async listExpiredFiles(olderThanDays: number = 30): Promise<string[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { blobs } = await list();
      
      return blobs
        .filter(blob => new Date(blob.uploadedAt) < cutoffDate)
        .map(blob => blob.url);
    } catch (error) {
      console.error('Failed to list expired files:', error);
      return [];
    }
  }

  static getPublicUrl(filename: string): string {
    // Vercel Blob URLs are already public
    return filename;
  }

  static extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || '';
    } catch {
      return '';
    }
  }
}

// src/lib/storage/cleanup.ts
import { PrismaClient } from '@prisma/client';
import { BlobStorage } from './blob';

const prisma = new PrismaClient();

export class StorageCleanup {
  static async cleanupExpiredUploads(): Promise<{
    deletedUploads: number;
    deletedResults: number;
    deletedBlobs: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let deletedUploads = 0;
    let deletedResults = 0;
    let deletedBlobs = 0;

    try {
      const now = new Date();

      // Find expired uploads
      const expiredUploads = await prisma.upload.findMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
        include: {
          tryOnResults: true,
        },
      });

      // Find expired try-on results
      const expiredResults = await prisma.tryOnResult.findMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      // Collect all blob URLs to delete
      const blobsToDelete: string[] = [];

      // Process expired uploads
      for (const upload of expiredUploads) {
        try {
          // Add upload blobs to deletion list
          blobsToDelete.push(upload.blobUrl);
          if (upload.thumbnailUrl) {
            blobsToDelete.push(upload.thumbnailUrl);
          }

          // Add associated result blobs
          for (const result of upload.tryOnResults) {
            if (result.resultUrl) blobsToDelete.push(result.resultUrl);
            if (result.thumbnailUrl) blobsToDelete.push(result.thumbnailUrl);
          }

          // Delete from database
          await prisma.upload.delete({
            where: { id: upload.id },
          });

          deletedUploads++;
        } catch (error) {
          errors.push(`Failed to delete upload ${upload.id}: ${error}`);
        }
      }

      // Process expired results (that aren't already deleted with uploads)
      for (const result of expiredResults) {
        try {
          if (result.resultUrl) blobsToDelete.push(result.resultUrl);
          if (result.thumbnailUrl) blobsToDelete.push(result.thumbnailUrl);

          await prisma.tryOnResult.delete({
            where: { id: result.id },
          });

          deletedResults++;
        } catch (error) {
          errors.push(`Failed to delete result ${result.id}: ${error}`);
        }
      }

      // Delete blobs from storage
      if (blobsToDelete.length > 0) {
        const deleteResult = await BlobStorage.deleteMultiple(blobsToDelete);
        deletedBlobs = deleteResult.success.length;
        
        if (deleteResult.failed.length > 0) {
          errors.push(`Failed to delete ${deleteResult.failed.length} blobs from storage`);
        }
      }

      // Clean up orphaned blobs (blobs in storage but not in database)
      await this.cleanupOrphanedBlobs();

    } catch (error) {
      errors.push(`General cleanup error: ${error}`);
    }

    return {
      deletedUploads,
      deletedResults,
      deletedBlobs,
      errors,
    };
  }

  private static async cleanupOrphanedBlobs(): Promise<void> {
    try {
      // Get all blob URLs from database
      const uploads = await prisma.upload.findMany({
        select: { blobUrl: true, thumbnailUrl: true },
      });

      const results = await prisma.tryOnResult.findMany({
        select: { resultUrl: true, thumbnailUrl: true },
        where: {
          OR: [
            { resultUrl: { not: null } },
            { thumbnailUrl: { not: null } },
          ],
        },
      });

      const dbUrls = new Set<string>();
      
      // Collect all URLs from database
      uploads.forEach(upload => {
        dbUrls.add(upload.blobUrl);
        if (upload.thumbnailUrl) dbUrls.add(upload.thumbnailUrl);
      });

      results.forEach(result => {
        if (result.resultUrl) dbUrls.add(result.resultUrl);
        if (result.thumbnailUrl) dbUrls.add(result.thumbnailUrl);
      });

      // Get expired blobs from storage
      const expiredBlobs = await BlobStorage.listExpiredFiles(30);
      
      // Find orphaned blobs (in storage but not in database)
      const orphanedBlobs = expiredBlobs.filter(url => !dbUrls.has(url));

      if (orphanedBlobs.length > 0) {
        console.log(`Found ${orphanedBlobs.length} orphaned blobs, cleaning up...`);
        await BlobStorage.deleteMultiple(orphanedBlobs);
      }
    } catch (error) {
      console.error('Failed to cleanup orphaned blobs:', error);
    }
  }

  static async cleanupFailedJobs(olderThanHours: number = 24): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

      const result = await prisma.tryOnResult.deleteMany({
        where: {
          status: 'FAILED',
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      return result.count;
    } catch (error) {
      console.error('Failed to cleanup failed jobs:', error);
      return 0;
    }
  }

  // Method to be called by cron job or webhook
  static async performScheduledCleanup(): Promise<void> {
    console.log('Starting scheduled storage cleanup...');
    
    const result = await this.cleanupExpiredUploads();
    const failedJobs = await this.cleanupFailedJobs();

    console.log('Cleanup completed:', {
      deletedUploads: result.deletedUploads,
      deletedResults: result.deletedResults,
      deletedBlobs: result.deletedBlobs,
      deletedFailedJobs: failedJobs,
      errors: result.errors.length,
    });

    if (result.errors.length > 0) {
      console.error('Cleanup errors:', result.errors);
    }
  }
}

// Database connection helper
// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to handle database errors
export function handlePrismaError(error: any): string {
  if (error.code === 'P2002') {
    return 'A record with this information already exists.';
  }
  if (error.code === 'P2025') {
    return 'The requested record was not found.';
  }
  if (error.code === 'P2003') {
    return 'This operation would violate a data constraint.';
  }
  
  console.error('Prisma error:', error);
  return 'A database error occurred.';
}

// Constants
// src/lib/constants.ts
export const APP_CONFIG = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  THUMBNAIL_SIZE: 300,
  RESULT_THUMBNAIL_SIZE: 400,
  RETENTION_DAYS: 30,
  MAX_RETRIES: 3,
  PROCESSING_TIMEOUT: 5 * 60 * 1000, // 5 minutes
} as const;

export const RATE_LIMITS = {
  UPLOAD: { requests: 10, windowMs: 15 * 60 * 1000 }, // 10 uploads per 15 minutes
  GENERATION: { requests: 5, windowMs: 5 * 60 * 1000 }, // 5 generations per 5 minutes
  API: { requests: 100, windowMs: 60 * 1000 }, // 100 API calls per minute
} as const;

export const ERROR_MESSAGES = {
  UPLOAD_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'File type not supported',
  NSFW_DETECTED: 'Image contains inappropriate content',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  PROCESSING_FAILED: 'Image processing failed. Please try again',
  INVALID_SESSION: 'Invalid or expired session',
  CONSENT_REQUIRED: 'Consent is required to proceed',
} as const;