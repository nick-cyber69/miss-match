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
    } else {
      console.log('Flux API key loaded, first 10 chars:', this.apiKey.substring(0, 10))
    }
  }

  async tryOn(input: TryOnInput): Promise<TryOnResult> {
    const startTime = Date.now()

    try {
      if (!this.apiKey) {
        throw new Error('FLUX_API_KEY is not configured')
      }

      // For Kontext virtual try-on, be very specific about keeping the same person
      const kontextPrompt = `Keep the exact same person, face, and background. Only change their clothing to match the reference garment.`
      
      console.log('Calling Flux Kontext Pro API...')
      console.log('Original image:', input.originalImageUrl)
      console.log('Garment reference:', input.garmentImageUrl)
      console.log('Prompt:', kontextPrompt)
      console.log('API Key present:', !!this.apiKey)

      // Step 1: Create the edit task using the correct Flux Kontext Pro endpoint
      const requestBody = {
        prompt: kontextPrompt,
        input_image: input.originalImageUrl,  // The person's photo
        input_image_2: input.garmentImageUrl,  // The garment as reference
        output_format: 'jpeg',
        safety_tolerance: 2
      }
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2))
      
      const createResponse = await fetch(`${this.apiUrl}/v1/flux-kontext-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      })
      
      // Get the raw response text first
      const responseText = await createResponse.text()
      console.log('Raw API response:', createResponse.status, responseText)
      
      if (!createResponse.ok) {
        // Try to parse as JSON if possible
        let errorDetail = responseText
        try {
          const errorJson = JSON.parse(responseText)
          errorDetail = errorJson.detail || errorJson.error || responseText
        } catch (e) {
          // Not JSON, use raw text
        }
        
        throw new Error(`Flux API error (${createResponse.status}): ${errorDetail}`)
      }

      // Parse the successful response
      let createData
      try {
        createData = JSON.parse(responseText)
      } catch (e) {
        throw new Error('Failed to parse API response: ' + responseText)
      }
      const taskId = createData.id
      const pollingUrl = createData.polling_url // Use the provided polling URL

      console.log('Task created:', taskId)
      console.log('Polling URL:', pollingUrl)

      // Step 2: Poll for the result using the provided polling URL
      let resultUrl: string | null = null
      let attempts = 0
      const maxAttempts = 60 // 60 seconds max wait

      while (!resultUrl && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

        const resultResponse = await fetch(pollingUrl, {
          method: 'GET',
          headers: {
            'x-key': this.apiKey
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

    // Be VERY specific about keeping the same person
    switch (category) {
      case 'top':
        return `The same person in the photo, but wearing a ${name} instead of their current top. Keep their exact face, body, pose, and background unchanged. Only change the clothing on their upper body.`
      
      case 'bottom':
        return `The same person in the photo, but wearing ${name} instead of their current bottom. Keep their exact face, body, pose, and background unchanged. Only change the clothing on their lower body.`
      
      case 'dress':
        return `The same person in the photo, but wearing a ${name} instead of their current outfit. Keep their exact face, body, pose, and background unchanged. Only change their clothing to this dress.`
      
      case 'set':
        return `The same person in the photo, but wearing ${name} instead of their current outfit. Keep their exact face, body, pose, and background unchanged. Only change their clothing.`
      
      default:
        return `The same person in the photo, but wearing ${name}. Keep their exact face, body, pose, and background unchanged. Only change their clothing.`
    }
  }
}