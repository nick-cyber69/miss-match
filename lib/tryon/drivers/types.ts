export interface TryOnInput {
  originalImageUrl: string
  garmentImageUrl: string
  garmentMeta?: {
    sku: string
    name?: string
    category?: 'top' | 'bottom' | 'dress' | 'set'
  }
  options?: {
    resolution?: 1024 | 1536
    safetyMode?: 'strict' | 'lenient'
  }
}

export interface TryOnResult {
  status: 'ok' | 'error'
  renderUrl: string
  latencyMs: number
  provider: string
  error?: string
}

export interface TryOnDriver {
  tryOn(input: TryOnInput): Promise<TryOnResult>
}