// src/app/api/images/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ImageValidator } from '@/lib/validation/image';
import { NSFWDetector } from '@/lib/validation/nsfw';
import { BlobStorage } from '@/lib/storage/blob';
import { imageUploadSchema } from '@/lib/validation/schemas';
import { generateSecureId, getExpirationDate, createRateLimiter } from '@/lib/utils';
import { APP_CONFIG, RATE_LIMITS, ERROR_MESSAGES } from '@/lib/constants';

const uploadRateLimit = createRateLimiter(RATE_LIMITS.UPLOAD.requests, RATE_LIMITS.UPLOAD.windowMs);

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Rate limiting
    if (!uploadRateLimit.check(clientIp)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const consent = formData.get('consent') === 'true';
    const sessionId = formData.get('sessionId') as string;

    // Validate input
    const validation = imageUploadSchema.safeParse({
      file,
      consent,
      sessionId,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check file size and type
    if (file.size > APP_CONFIG.MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UPLOAD_TOO_LARGE },
        { status: 400 }
      );
    }

    if (!APP_CONFIG.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_FILE_TYPE },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate image
    const imageValidation = await ImageValidator.validateImage(buffer, file.name);
    if (!imageValidation.isValid) {
      return NextResponse.json(
        { error: imageValidation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Strip EXIF and optimize
    const optimizedBuffer = await ImageValidator.stripExifAndOptimize(buffer);
    const thumbnailBuffer = await ImageValidator.createThumbnail(optimizedBuffer);

    // Upload to blob storage
    const [uploadResult, thumbnailResult] = await Promise.all([
      BlobStorage.uploadImage(optimizedBuffer, file.name, 'image/jpeg', 'uploads'),
      BlobStorage.uploadImage(thumbnailBuffer, `thumb_${file.name}`, 'image/jpeg', 'thumbnails'),
    ]);

    // NSFW check (async - don't block the response)
    const nsfwCheckPromise = NSFWDetector.checkImage(uploadResult.url)
      .then(async (nsfwResult) => {
        await prisma.upload.update({
          where: { fileName: uploadResult.filename },
          data: {
            nsfwScore: nsfwResult.score,
            nsfwChecked: true,
            status: nsfwResult.isNSFW ? 'REJECTED' : 'APPROVED',
          },
        });

        // If NSFW detected, delete the images
        if (nsfwResult.isNSFW) {
          await Promise.all([
            BlobStorage.deleteImage(uploadResult.url),
            BlobStorage.deleteImage(thumbnailResult.url),
          ]);
        }
      })
      .catch(error => {
        console.error('NSFW check failed:', error);
        // Mark as approved if NSFW check fails (fail-safe)
        prisma.upload.update({
          where: { fileName: uploadResult.filename },
          data: { status: 'APPROVED', nsfwChecked: true },
        }).catch(console.error);
      });

    // Save to database
    const upload = await prisma.upload.create({
      data: {
        originalName: file.name,
        fileName: uploadResult.filename,
        fileSize: optimizedBuffer.length,
        mimeType: 'image/jpeg',
        width: imageValidation.metadata!.width,
        height: imageValidation.metadata!.height,
        blobUrl: uploadResult.url,
        thumbnailUrl: thumbnailResult.url,
        status: 'PROCESSING', // Will be updated by NSFW check
        exifStripped: true,
        ipAddress: clientIp,
        userAgent: request.headers.get('user-agent') || undefined,
        expiresAt: getExpirationDate(APP_CONFIG.RETENTION_DAYS),
      },
    });

    // Don't await NSFW check - let it run in background
    nsfwCheckPromise.catch(console.error);

    return NextResponse.json({
      success: true,
      upload: {
        id: upload.id,
        url: upload.blobUrl,
        thumbnailUrl: upload.thumbnailUrl,
        status: upload.status,
        width: upload.width,
        height: upload.height,
        fileName: upload.fileName,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}

// src/app/api/garments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const where = {
      isActive: true,
      ...(category && { category: category.toUpperCase() as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { tags: { has: search } },
        ],
      }),
    };

    const [garments, total] = await Promise.all([
      prisma.garment.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          subcategory: true,
          imageUrl: true,
          thumbnailUrl: true,
          brand: true,
          color: true,
          tags: true,
        },
      }),
      prisma.garment.count({ where }),
    ]);

    return NextResponse.json({
      garments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Garments fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch garments' },
      { status: 500 }
    );
  }
}

// src/app/api/tryon/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { TryOnDriverFactory } from '@/lib/tryon/factory';
import { garmentSelectionSchema } from '@/lib/validation/schemas';
import { createRateLimiter, getExpirationDate } from '@/lib/utils';
import { RATE_LIMITS, ERROR_MESSAGES } from '@/lib/constants';

const generationRateLimit = createRateLimiter(
  RATE_LIMITS.GENERATION.requests, 
  RATE_LIMITS.GENERATION.windowMs
);

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting
    if (!generationRateLimit.check(clientIp)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validation = garmentSelectionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { garmentId, uploadId, options } = validation.data;

    // Verify upload exists and is approved
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
    });

    if (!upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    if (upload.status === 'REJECTED') {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NSFW_DETECTED },
        { status: 400 }
      );
    }

    if (upload.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Upload is still being processed. Please try again in a moment.' },
        { status: 400 }
      );
    }

    // Verify garment exists
    const garment = await prisma.garment.findUnique({
      where: { id: garmentId },
    });

    if (!garment || !garment.isActive) {
      return NextResponse.json(
        { error: 'Garment not found or unavailable' },
        { status: 404 }
      );
    }

    // Check for existing processing job for this combination
    const existingResult = await prisma.tryOnResult.findFirst({
      where: {
        uploadId,
        garmentId,
        status: {
          in: ['QUEUED', 'PROCESSING'],
        },
      },
    });

    if (existingResult) {
      return NextResponse.json({
        success: true,
        resultId: existingResult.id,
        status: existingResult.status,
        message: 'Job already in progress',
      });
    }

    // Create try-on result record
    const tryOnResult = await prisma.tryOnResult.create({
      data: {
        uploadId,
        garmentId,
        status: 'QUEUED',
        driver: process.env.TRYON_DRIVER || 'flux',
        processingParams: options,
        expiresAt: getExpirationDate(APP_CONFIG.RETENTION_DAYS),
      },
    });

    // Initialize try-on driver
    const driver = TryOnDriverFactory.create();

    // Start processing (async)
    const processingPromise = driver.generate({
      personImageUrl: upload.blobUrl,
      garmentImageUrl: garment.imageUrl,
      sessionId: body.sessionId || 'anonymous',
      userId: body.userId,
      options: {
        preserveBackground: options?.preserveBackground ?? true,
        quality: options?.quality ?? 'high',
        style: options?.style ?? 'realistic',
      },
    }).then(async (response) => {
      // Update database with job ID and status
      await prisma.tryOnResult.update({
        where: { id: tryOnResult.id },
        data: {
          externalJobId: response.jobId,
          status: response.status === 'failed' ? 'FAILED' : 'PROCESSING',
          errorMessage: response.error,
        },
      });

      // If completed immediately, save result
      if (response.status === 'completed' && response.resultUrl) {
        const thumbnailBuffer = response.resultUrl ? 
          await ImageValidator.createThumbnail(
            Buffer.from(await (await fetch(response.resultUrl)).arrayBuffer())
          ) : null;

        const thumbnailUpload = thumbnailBuffer ? 
          await BlobStorage.uploadImage(
            thumbnailBuffer, 
            `result_thumb_${tryOnResult.id}.jpg`, 
            'image/jpeg', 
            'thumbnails'
          ) : null;

        await prisma.tryOnResult.update({
          where: { id: tryOnResult.id },
          data: {
            status: 'COMPLETED',
            resultUrl: response.resultUrl,
            thumbnailUrl: thumbnailUpload?.url,
            processingTime: response.processingTime,
          },
        });
      }
    }).catch(async (error) => {
      console.error('Try-on processing failed:', error);
      await prisma.tryOnResult.update({
        where: { id: tryOnResult.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
    });

    // Don't await - let it run in background
    processingPromise.catch(console.error);

    return NextResponse.json({
      success: true,
      resultId: tryOnResult.id,
      status: tryOnResult.status,
      estimatedTime: driver.estimatedProcessingTime,
      message: 'Processing started',
    });

  } catch (error) {
    console.error('Try-on generation error:', error);
    return NextResponse.json(
      { error: 'Failed to start try-on generation' },
      { status: 500 }
    );
  }
}

// src/app/api/tryon/status/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { TryOnDriverFactory } from '@/lib/tryon/factory';
import { ImageValidator } from '@/lib/validation/image';
import { BlobStorage } from '@/lib/storage/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resultId = params.id;

    const result = await prisma.tryOnResult.findUnique({
      where: { id: resultId },
      include: {
        upload: true,
        garment: true,
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    // If we have an external job ID and status is not final, check with driver
    if (result.externalJobId && ['QUEUED', 'PROCESSING'].includes(result.status)) {
      try {
        const driver = TryOnDriverFactory.create(result.driver);
        const driverStatus = await driver.getStatus(result.externalJobId);

        // Update our database if status changed
        if (driverStatus.status === 'completed' && driverStatus.resultUrl) {
          // Download and store result
          const resultUpload = await BlobStorage.uploadFromUrl(
            driverStatus.resultUrl,
            `result_${result.id}.jpg`,
            'results'
          );

          // Create thumbnail
          const thumbnailBuffer = await ImageValidator.createThumbnail(
            Buffer.from(await (await fetch(driverStatus.resultUrl)).arrayBuffer())
          );

          const thumbnailUpload = await BlobStorage.uploadImage(
            thumbnailBuffer,
            `result_thumb_${result.id}.jpg`,
            'image/jpeg',
            'thumbnails'
          );

          // Update database
          const updatedResult = await prisma.tryOnResult.update({
            where: { id: result.id },
            data: {
              status: 'COMPLETED',
              resultUrl: resultUpload.url,
              thumbnailUrl: thumbnailUpload.url,
              processingTime: driverStatus.processingTime,
            },
          });

          return NextResponse.json({
            id: updatedResult.id,
            status: updatedResult.status,
            resultUrl: updatedResult.resultUrl,
            thumbnailUrl: updatedResult.thumbnailUrl,
            processingTime: updatedResult.processingTime,
            createdAt: updatedResult.createdAt,
          });
        } else if (driverStatus.status === 'failed') {
          await prisma.tryOnResult.update({
            where: { id: result.id },
            data: {
              status: 'FAILED',
              errorMessage: driverStatus.error || 'Processing failed',
            },
          });
        }
      } catch (error) {
        console.error('Driver status check failed:', error);
      }
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      resultUrl: result.resultUrl,
      thumbnailUrl: result.thumbnailUrl,
      processingTime: result.processingTime,
      errorMessage: result.errorMessage,
      createdAt: result.createdAt,
      upload: {
        id: result.upload.id,
        thumbnailUrl: result.upload.thumbnailUrl,
      },
      garment: {
        id: result.garment.id,
        name: result.garment.name,
        thumbnailUrl: result.garment.thumbnailUrl,
      },
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}

// src/app/api/webhooks/tryon/flux/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { BlobStorage } from '@/lib/storage/blob';
import { ImageValidator } from '@/lib/validation/image';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-flux-signature');
    const body = await request.text();
    
    if (process.env.WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(body)
        .digest('hex');
      
      if (`sha256=${expectedSignature}` !== signature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const payload = JSON.parse(body);
    const { job_id, status, result_url, thumbnail_url, processing_time, error, metadata } = payload;

    if (!job_id) {
      return NextResponse.json(
        { error: 'Missing job_id' },
        { status: 400 }
      );
    }

    // Find the result by external job ID
    const result = await prisma.tryOnResult.findFirst({
      where: { externalJobId: job_id },
    });

    if (!result) {
      console.warn(`Webhook received for unknown job: ${job_id}`);
      return NextResponse.json({ received: true });
    }

    // Update based on status
    if (status === 'completed' && result_url) {
      try {
        // Download and store the result
        const resultUpload = await BlobStorage.uploadFromUrl(
          result_url,
          `result_${result.id}.jpg`,
          'results'
        );

        // Create thumbnail if not provided
        let thumbnailUrl = thumbnail_url;
        if (!thumbnailUrl) {
          const thumbnailBuffer = await ImageValidator.createThumbnail(
            Buffer.from(await (await fetch(result_url)).arrayBuffer())
          );

          const thumbnailUpload = await BlobStorage.uploadImage(
            thumbnailBuffer,
            `result_thumb_${result.id}.jpg`,
            'image/jpeg',
            'thumbnails'
          );

          thumbnailUrl = thumbnailUpload.url;
        } else {
          // Store provided thumbnail
          const thumbnailUpload = await BlobStorage.uploadFromUrl(
            thumbnail_url,
            `result_thumb_${result.id}.jpg`,
            'thumbnails'
          );
          thumbnailUrl = thumbnailUpload.url;
        }

        await prisma.tryOnResult.update({
          where: { id: result.id },
          data: {
            status: 'COMPLETED',
            resultUrl: resultUpload.url,
            thumbnailUrl,
            processingTime: processing_time ? Math.round(processing_time * 1000) : null,
            webhookReceived: true,
          },
        });

      } catch (error) {
        console.error('Failed to process completed webhook:', error);
        await prisma.tryOnResult.update({
          where: { id: result.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Failed to download result',
            webhookReceived: true,
          },
        });
      }
    } else if (status === 'failed') {
      await prisma.tryOnResult.update({
        where: { id: result.id },
        data: {
          status: 'FAILED',
          errorMessage: error || 'Processing failed',
          webhookReceived: true,
        },
      });
    } else {
      // Update status for intermediate states
      const dbStatus = status === 'processing' ? 'PROCESSING' : 
                      status === 'queued' ? 'QUEUED' : result.status;

      await prisma.tryOnResult.update({
        where: { id: result.id },
        data: {
          status: dbStatus,
          webhookReceived: true,
        },
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Flux webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// src/app/api/webhooks/tryon/nano-banana/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { BlobStorage } from '@/lib/storage/blob';
import { ImageValidator } from '@/lib/validation/image';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { id, status, output, error, metrics } = payload;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing prediction id' },
        { status: 400 }
      );
    }

    const result = await prisma.tryOnResult.findFirst({
      where: { externalJobId: id },
    });

    if (!result) {
      console.warn(`Webhook received for unknown prediction: ${id}`);
      return NextResponse.json({ received: true });
    }

    if (status === 'succeeded' && output) {
      try {
        const resultUrl = Array.isArray(output) ? output[0] : output;
        
        const resultUpload = await BlobStorage.uploadFromUrl(
          resultUrl,
          `result_${result.id}.jpg`,
          'results'
        );

        const thumbnailBuffer = await ImageValidator.createThumbnail(
          Buffer.from(await (await fetch(resultUrl)).arrayBuffer())
        );

        const thumbnailUpload = await BlobStorage.uploadImage(
          thumbnailBuffer,
          `result_thumb_${result.id}.jpg`,
          'image/jpeg',
          'thumbnails'
        );

        await prisma.tryOnResult.update({
          where: { id: result.id },
          data: {
            status: 'COMPLETED',
            resultUrl: resultUpload.url,
            thumbnailUrl: thumbnailUpload.url,
            processingTime: metrics?.predict_time ? 
              Math.round(metrics.predict_time * 1000) : null,
            webhookReceived: true,
          },
        });

      } catch (error) {
        console.error('Failed to process nano-banana webhook:', error);
        await prisma.tryOnResult.update({
          where: { id: result.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Failed to download result',
            webhookReceived: true,
          },
        });
      }
    } else if (status === 'failed' || status === 'canceled') {
      await prisma.tryOnResult.update({
        where: { id: result.id },
        data: {
          status: 'FAILED',
          errorMessage: error || 'Processing failed or canceled',
          webhookReceived: true,
        },
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Nano-banana webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// src/app/api/webhooks/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StorageCleanup } from '@/lib/storage/cleanup';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret for security
    const signature = request.headers.get('authorization');
    const expectedSignature = `Bearer ${process.env.WEBHOOK_SECRET}`;

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled cleanup via webhook...');
    await StorageCleanup.performScheduledCleanup();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Cleanup webhook error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}

// Alternative: Cleanup via Vercel Cron Job (vercel.json)
/*
{
  "crons": [
    {
      "path": "/api/webhooks/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
*/

    