import { NextResponse } from 'next/server'

export async function GET() {
  // Using static data for now - database connection coming soon
  const garments = [
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
    },
    {
      id: '4',
      name: 'Red Hoodie',
      category: 'tops',
      imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
      active: true
    },
    {
      id: '5',
      name: 'Floral Dress',
      category: 'dresses',
      imageUrl: 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=400',
      active: true
    },
    {
      id: '6',
      name: 'Denim Jacket',
      category: 'outerwear',
      imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400',
      active: true
    }
  ]
  
  return NextResponse.json({ garments })
}
