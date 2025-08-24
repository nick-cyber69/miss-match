// src/lib/tryon/types.ts
export interface TryOnRequest {
  personImageUrl: string;
  garmentImageUrl: string;
  userId?: string;
  sessionId: string;
  options?: TryOnOptions;
}

export interface TryOnOptions {
  preserveBackground?: boolean;
  quality?: 'standard' | 'high' | 'ultra';
  style?: 'realistic' | 'artistic';
  fitAdjustment?: number; // -1 to 1, for loose to tight fit
}

export interface TryOnResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  thumbnailUrl?: string;
  processingTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TryOnDriver {
  name: string;
  version: string;
  supportedFormats: string[];
  maxImageSize: number;
  estimatedProcessingTime: number; // seconds
  
  generate(request: TryOnRequest): Promise<TryOnResponse>;
  getStatus(jobId: string): Promise<TryOnResponse>;
  cancel?(jobId: string): Promise<boolean>;
  validateRequest(request: TryOnRequest): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// src/lib/tryon/drivers/base.ts
import { TryOnDriver, TryOnRequest, TryOnResponse, ValidationResult } from '../types';

export abstract class BaseTryOnDriver implements TryOnDriver {
  abstract name: string;
  abstract version: string;
  abstract supportedFormats: string[];
  abstract maxImageSize: number;
  abstract estimatedProcessingTime: number;

  protected abstract apiKey: string;
  protected abstract baseUrl: string;

  abstract generate(request: TryOnRequest): Promise<TryOnResponse>;
  abstract getStatus(jobId: string): Promise<TryOnResponse>;

  async validateRequest(request: TryOnRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Common validations
    if (!request.personImageUrl) {
      errors.push('Person image URL is required');
    }

    if (!request.garmentImageUrl) {
      errors.push('Garment image URL is required');
    }

    if (!request.sessionId) {
      errors.push('Session ID is required');
    }

    // URL validation
    try {
      new URL(request.personImageUrl);
    } catch {
      errors.push('Invalid person image URL');
    }

    try {
      new URL(request.garmentImageUrl);
    } catch {
      errors.push('Invalid garment image URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} ${error}`);
    }

    return response.json();
  }
}

// src/lib/tryon/drivers/flux.ts
import { BaseTryOnDriver } from './base';
import { TryOnRequest, TryOnResponse } from '../types';

export class FluxTryOnDriver extends BaseTryOnDriver {
  name = 'Flux';
  version = '1.0';
  supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  maxImageSize = 10 * 1024 * 1024; // 10MB
  estimatedProcessingTime = 45; // seconds

  protected apiKey = process.env.FLUX_API_KEY!;
  protected baseUrl = process.env.FLUX_API_URL!;

  async generate(request: TryOnRequest): Promise<TryOnResponse> {
    const validation = await this.validateRequest(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const payload = {
        person_image: request.personImageUrl,
        garment_image: request.garmentImageUrl,
        preserve_background: request.options?.preserveBackground ?? true,
        quality: request.options?.quality ?? 'high',
        style: request.options?.style ?? 'realistic',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/tryon/flux`,
        metadata: {
          session_id: request.sessionId,
          user_id: request.userId,
        }
      };

      const response = await this.makeRequest<{
        job_id: string;
        status: string;
        estimated_time: number;
      }>('/tryon/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        jobId: response.job_id,
        status: this.mapStatus(response.status),
        processingTime: response.estimated_time * 1000, // Convert to ms
        metadata: {
          driver: 'flux',
          originalResponse: response,
        }
      };
    } catch (error) {
      return {
        jobId: `flux-error-${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStatus(jobId: string): Promise<TryOnResponse> {
    try {
      const response = await this.makeRequest<{
        job_id: string;
        status: string;
        result_url?: string;
        thumbnail_url?: string;
        processing_time?: number;
        error?: string;
      }>(`/tryon/status/${jobId}`);

      return {
        jobId: response.job_id,
        status: this.mapStatus(response.status),
        resultUrl: response.result_url,
        thumbnailUrl: response.thumbnail_url,
        processingTime: response.processing_time,
        error: response.error,
      };
    } catch (error) {
      return {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed',
      };
    }
  }

  async cancel(jobId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/tryon/cancel/${jobId}`, {
        method: 'POST',
      });
      return true;
    } catch {
      return false;
    }
  }

  private mapStatus(fluxStatus: string): 'queued' | 'processing' | 'completed' | 'failed' {
    switch (fluxStatus.toLowerCase()) {
      case 'pending':
      case 'queued':
        return 'queued';
      case 'running':
      case 'processing':
        return 'processing';
      case 'completed':
      case 'success':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'queued';
    }
  }
}

// src/lib/tryon/drivers/nano-banana.ts
import { BaseTryOnDriver } from './base';
import { TryOnRequest, TryOnResponse } from '../types';

export class NanoBananaTryOnDriver extends BaseTryOnDriver {
  name = 'Nano Banana';
  version = '1.0';
  supportedFormats = ['image/jpeg', 'image/png'];
  maxImageSize = 8 * 1024 * 1024; // 8MB
  estimatedProcessingTime = 30; // seconds

  protected apiKey = process.env.NANO_BANANA_API_KEY!;
  protected baseUrl = process.env.NANO_BANANA_API_URL!;

  async generate(request: TryOnRequest): Promise<TryOnResponse> {
    const validation = await this.validateRequest(request);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const payload = {
        input: {
          person_image_url: request.personImageUrl,
          garment_image_url: request.garmentImageUrl,
          preserve_background: request.options?.preserveBackground ?? true,
          fit_adjustment: request.options?.fitAdjustment ?? 0,
        },
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/tryon/nano-banana`,
        webhook_events_filter: ['output', 'completed'],
      };

      const response = await this.makeRequest<{
        id: string;
        status: string;
      }>('/predictions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        jobId: response.id,
        status: this.mapStatus(response.status),
        metadata: {
          driver: 'nano-banana',
          originalResponse: response,
        }
      };
    } catch (error) {
      return {
        jobId: `nano-banana-error-${Date.now()}`,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getStatus(jobId: string): Promise<TryOnResponse> {
    try {
      const response = await this.makeRequest<{
        id: string;
        status: string;
        output?: string | string[];
        error?: string;
        metrics?: {
          predict_time: number;
        };
      }>(`/predictions/${jobId}`);

      let resultUrl: string | undefined;
      if (response.output) {
        // Handle both string and array outputs
        resultUrl = Array.isArray(response.output) 
          ? response.output[0] 
          : response.output;
      }

      return {
        jobId: response.id,
        status: this.mapStatus(response.status),
        resultUrl,
        processingTime: response.metrics?.predict_time ? 
          Math.round(response.metrics.predict_time * 1000) : undefined,
        error: response.error,
      };
    } catch (error) {
      return {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed',
      };
    }
  }

  private mapStatus(nanoStatus: string): 'queued' | 'processing' | 'completed' | 'failed' {
    switch (nanoStatus.toLowerCase()) {
      case 'starting':
      case 'queued':
        return 'queued';
      case 'running':
      case 'processing':
        return 'processing';
      case 'succeeded':
      case 'completed':
        return 'completed';
      case 'failed':
      case 'canceled':
        return 'failed';
      default:
        return 'queued';
    }
  }
}

// src/lib/tryon/factory.ts
import { TryOnDriver } from './types';
import { FluxTryOnDriver } from './drivers/flux';
import { NanoBananaTryOnDriver } from './drivers/nano-banana';

export class TryOnDriverFactory {
  private static drivers: Map<string, () => TryOnDriver> = new Map([
    ['flux', () => new FluxTryOnDriver()],
    ['nanobanana', () => new NanoBananaTryOnDriver()],
  ]);

  static create(driverName?: string): TryOnDriver {
    const driver = driverName || process.env.TRYON_DRIVER || 'flux';
    
    const driverFactory = this.drivers.get(driver.toLowerCase());
    if (!driverFactory) {
      throw new Error(`Unknown try-on driver: ${driver}`);
    }

    return driverFactory();
  }

  static getSupportedDrivers(): string[] {
    return Array.from(this.drivers.keys());
  }

  static registerDriver(name: string, factory: () => TryOnDriver): void {
    this.drivers.set(name.toLowerCase(), factory);
  }
}