import { NextResponse } from 'next/server'

export async function GET() {
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
