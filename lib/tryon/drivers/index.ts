import { TryOnDriver } from './types'
import { MockTryOnDriver } from './mock'
import { FluxTryOnDriver } from './flux'

export * from './types'

/**
 * Get the configured try-on driver based on environment variable
 * Defaults to 'mock' if not specified
 */
export function getTryOnDriver(): TryOnDriver {
  const driverType = process.env.TRYON_DRIVER || 'mock'
  
  console.log(`Using try-on driver: ${driverType}`)

  switch (driverType.toLowerCase()) {
    case 'mock':
      return new MockTryOnDriver()
    
    case 'flux':
    case 'kontext':
      return new FluxTryOnDriver()
    
    case 'nanobanana':
      // Placeholder for future Nano Banana implementation
      throw new Error('Nano Banana driver not yet implemented')
    
    default:
      console.warn(`Unknown driver type: ${driverType}, falling back to mock`)
      return new MockTryOnDriver()
  }
}