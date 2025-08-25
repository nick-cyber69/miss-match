import { NextRequest, NextResponse } from 'next/server'
import { getTryOnDriver } from '@/lib/tryon/drivers'

// Demo garments - same as in the UI
// In production, this would come from your database
const GARMENTS_DB = [
  {
    id: '1',
    name: 'White T-Shirt',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=600&fit=crop',
    category: 'top' as const,
    sku: 'WT001'
  },
  {
    id: '2',
    name: 'Black Dress',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
    category: 'dress' as const,
    sku: 'BD002'
  },
  {
    id: '3',
    name: 'Denim Jacket',
    imageUrl: 'https://images.unsplash.com/photo-1601333144130-8cbb312bdd55?w=400&h=600&fit=crop',
    category: 'top' as const,
    sku: 'DJ003'
  }
]

export async function POST(request: NextRequest) {
  try {
    const { originalImageUrl, garmentId } = await request.json()

    // Validate required fields
    if (!originalImageUrl || !garmentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the garment
    const garment = GARMENTS_DB.find(g => g.id === garmentId)
    if (!garment) {
      return NextResponse.json(
        { error: 'Garment not found' },
        { status: 404 }
      )
    }

    // Get the configured driver
    const driver = getTryOnDriver()

    // Call the try-on driver
    const result = await driver.tryOn({
      originalImageUrl,
      garmentImageUrl: garment.imageUrl,
      garmentMeta: {
        sku: garment.sku,
        name: garment.name,
        category: garment.category
      },
      options: {
        resolution: 1024,
        safetyMode: 'strict'
      }
    })

    // Check if there was an error
    if (result.status === 'error') {
      console.error('Try-on failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Try-on generation failed' },
        { status: 500 }
      )
    }

    // Return the successful result
    return NextResponse.json({
      renderUrl: result.renderUrl,
      latencyMs: result.latencyMs,
      provider: result.provider
    })

  } catch (error) {
    console.error('Try-on API error:', error)
    return NextResponse.json(
      { error: 'Try-on generation failed' },
      { status: 500 }
    )
  }
}