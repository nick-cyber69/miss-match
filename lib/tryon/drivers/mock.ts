import { TryOnDriver, TryOnInput, TryOnResult } from './types'

/**
 * Mock driver for testing and demos
 * Returns the original image after a simulated delay
 */
export class MockTryOnDriver implements TryOnDriver {
  async tryOn(input: TryOnInput): Promise<TryOnResult> {
    console.log('Mock driver processing:', {
      original: input.originalImageUrl,
      garment: input.garmentImageUrl,
      meta: input.garmentMeta
    })

    // Simulate processing delay (1.5-2 seconds)
    const delay = 1500 + Math.random() * 500
    await new Promise(resolve => setTimeout(resolve, delay))

    // For the mock, just return the original image
    // In production, this would be the AI-generated result
    return {
      status: 'ok',
      renderUrl: input.originalImageUrl, // Just return original for demo
      latencyMs: delay,
      provider: 'mock'
    }
  }
}