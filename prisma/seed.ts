import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const garments = [
    {
      name: 'Classic White T-Shirt',
      category: 'tops',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    },
    {
      name: 'Blue Jeans',
      category: 'bottoms',
      imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    },
    {
      name: 'Black Dress',
      category: 'dresses',
      imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    },
  ]

  for (const garment of garments) {
    await prisma.garment.create({
      data: garment
    })
  }
  console.log('Added 3 garments!')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())