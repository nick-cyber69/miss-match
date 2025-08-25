import { NextRequest, NextResponse } from 'next/server'
import { getTryOnDriver } from '@/lib/tryon/drivers'

// Demo garments - same as in the UI
// In production, this would come from your database
const GARMENTS_DB = [
  {
    id: '1',
    name: 'Yellow Plaid Blazer Dress',
    imageUrl: '/garments/yellow-plaid.jpg',
    category: 'dress' as const,
    sku: 'YPB001'
  },
  {
    id: '2',
    name: 'White T-Shirt',
    imageUrl: '/garments/white-tshirt.jpg',
    category: 'top' as const,
    sku: 'WT002'
  },
  {
    id: '3',
    name: 'Denim Jacket',
    imageUrl: '/garments/denim-jacket.jpg',
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