import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Try to get from database first
    const garments = await prisma.garment.findMany({
      where: { active: true }
    })
    
    // If database is empty, return test data
    if (garments.length === 0) {
      const testGarments = [
        {
          id: '1',
          name: 'Classic White T-Shirt',
          category: 'tops',
          imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
          active: true
        },
        {
          id: '2', 
          name: 'Blue Jeans',
          category: 'bottoms',
          imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
          active: true
        },
        {
          id: '3',
          name: 'Black Dress',
          category: 'dresses',
          imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
          active: true
        }
      ]
      return NextResponse.json({ garments: testGarments })
    }
    
    return NextResponse.json({ garments })
  } catch (error) {
    console.error('Database error, using test data:', error)
    // Fallback to test data if database fails
    const testGarments = [
      {
        id: '1',
        name: 'Classic White T-Shirt',
        category: 'tops',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
        active: true
      }
    ]
    return NextResponse.json({ garments: testGarments })
  }
}
