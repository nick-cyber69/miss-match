import { TryOnDriver, TryOnInput, TryOnResult } from './types'

/**
 * Flux Kontext Pro driver for virtual try-on
 * Uses the BFL AI Kontext API for image editing
 */
export class FluxTryOnDriver implements TryOnDriver {
  private apiKey: string
  private apiUrl: string = 'https://api.bfl.ai'

  constructor() {
    this.apiKey = process.env.FLUX_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('FLUX_API_KEY not set - Flux driver will not work')
    }
  }

  async tryOn(input: TryOnInput): Promise<TryOnResult> {
    const startTime = Date.now()

    try {
      if (!this.apiKey) {
        throw new Error('FLUX_API_KEY is not configured')
      }

      // For Kontext, the image URL goes in the prompt with special syntax
      const kontextPrompt = `[img]${input.originalImageUrl}[/img] ${prompt}`

      console.log('Calling Flux Kontext API...')
      console.log('Prompt:', kontextPrompt)

      // Step 1: Create the edit task
      const createResponse = await fetch(`${this.apiUrl}/v1/flux-pro-1.1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          prompt: kontextPrompt,
          width: 1024,
          height: 1536,
          steps: 50,
          guidance_scale: 7.5,
          output_format: 'jpeg'
        })
      })

      if (!createResponse.ok) {
        const errorText = await createResponse.text()
        console.error('Flux API response:', createResponse.status, errorText)
        throw new Error(`Flux API error (${createResponse.status}): ${errorText}`)
      }

      const createData = await createResponse.json()
      const taskId = createData.id

      console.log('Task created:', taskId)

      // Step 2: Poll for the result
      let resultUrl: string | null = null
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max wait

      while (!resultUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

        const resultResponse = await fetch(`${this.apiUrl}/v1/get_result?id=${taskId}`, {
          method: 'GET',
          headers: {
            'x-api-key': this.apiKey
          }
        })

        if (resultResponse.ok) {
          const resultData = await resultResponse.json()
          console.log('Poll attempt', attempts + 1, 'Status:', resultData.status)
          
          if (resultData.status === 'Ready' && resultData.result) {
            // The result might be in result.sample or result.output
            resultUrl = resultData.result.sample || resultData.result.output || resultData.result
            break
          } else if (resultData.status === 'failed' || resultData.status === 'Failed') {
            throw new Error('Task failed: ' + (resultData.error || 'Unknown error'))
          }
          // If status is "Pending", continue polling
        }

        attempts++
      }

      if (!resultUrl) {
        throw new Error('Timeout waiting for result after 60 seconds')
      }

      console.log('Try-on completed:', resultUrl)

      return {
        status: 'ok',
        renderUrl: resultUrl,
        latencyMs: Date.now() - startTime,
        provider: 'flux-kontext'
      }

    } catch (error) {
      console.error('Flux driver error:', error)
      return {
        status: 'error',
        renderUrl: '',
        latencyMs: Date.now() - startTime,
        provider: 'flux-kontext',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate appropriate prompt based on garment type
   */
  private generatePrompt(garmentMeta?: { 
    sku: string
    name?: string
    category?: 'top' | 'bottom' | 'dress' | 'set' 
  }): string {
    const category = garmentMeta?.category || 'top'
    const name = garmentMeta?.name || 'garment'

    // Craft prompts that preserve the person and background
    // while changing only the clothing
    switch (category) {
      case 'top':
        return `Change only the person's top/shirt to a ${name}. Keep the exact same pose, face, hair, body shape, and background. Do not modify anything except the upper body clothing.`
      
      case 'bottom':
        return `Change only the person's pants/skirt to a ${name}. Keep the exact same pose, face, hair, body shape, and background. Do not modify anything except the lower body clothing.`
      
      case 'dress':
        return `Replace the person's outfit with a ${name} dress. Keep the exact same pose, face, hair, body shape, and background. Only change the clothing to this dress.`
      
      case 'set':
        return `Change the person's entire outfit to a ${name}. Keep the exact same pose, face, hair, body shape, and background. Only modify the clothing.`
      
      default:
        return `Change the person's clothing to a ${name}. Keep everything else exactly the same - pose, face, hair, body, and background. Only modify the clothing.`
    }
  }
}