// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // Add your external image domains here
      {
        protocol: 'https',
        hostname: 'example-garments.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Security headers
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },
  // Environment variables validation at build time
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Enable source maps in production for debugging
  productionBrowserSourceMaps: false,
  
  // Optimize bundles
  swcMinify: true,
  
  // Security
  poweredByHeader: false,
};

module.exports = nextConfig;

// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;

// tsconfig.json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/app/*": ["./src/app/*"],
      "@/types/*": ["./src/types/*"]
    },
    "target": "es5",
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts", 
    "**/*.tsx", 
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}

// vercel.json (Optional - for custom deployment config)
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "src/app/api/tryon/generate/route.ts": {
      "maxDuration": 300
    },
    "src/app/api/webhooks/cleanup/route.ts": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/webhooks/cleanup",
      "schedule": "0 2 * * *"
    }
  ],
  "regions": ["iad1"],
  "env": {
    "POSTGRES_PRISMA_URL": "@postgres_prisma_url",
    "POSTGRES_URL_NON_POOLING": "@postgres_url_non_pooling"
  }
}

// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Sample garments
  const sampleGarments = [
    {
      name: 'Classic White T-Shirt',
      description: 'Essential cotton t-shirt in crisp white',
      category: 'TOPS',
      subcategory: 'T-Shirts',
      imageUrl: '/garments/white-tshirt.jpg',
      thumbnailUrl: '/garments/thumbs/white-tshirt.jpg',
      brand: 'Miss Match Essentials',
      color: 'White',
      tags: ['casual', 'essential', 'cotton', 'basic'],
      displayOrder: 1,
    },
    {
      name: 'Blue Denim Jeans',
      description: 'Classic straight-leg denim jeans',
      category: 'BOTTOMS',
      subcategory: 'Jeans',
      imageUrl: '/garments/blue-jeans.jpg',
      thumbnailUrl: '/garments/thumbs/blue-jeans.jpg',
      brand: 'Miss Match Denim',
      color: 'Blue',
      tags: ['denim', 'casual', 'classic', 'versatile'],
      displayOrder: 2,
    },
    {
      name: 'Little Black Dress',
      description: 'Elegant little black dress perfect for any occasion',
      category: 'DRESSES',
      subcategory: 'Evening',
      imageUrl: '/garments/black-dress.jpg',
      thumbnailUrl: '/garments/thumbs/black-dress.jpg',
      brand: 'Miss Match Formal',
      color: 'Black',
      tags: ['formal', 'elegant', 'versatile', 'evening'],
      displayOrder: 3,
    },
    {
      name: 'Cozy Cardigan',
      description: 'Soft knit cardigan in warm beige',
      category: 'TOPS',
      subcategory: 'Cardigans',
      imageUrl: '/garments/beige-cardigan.jpg',
      thumbnailUrl: '/garments/thumbs/beige-cardigan.jpg',
      brand: 'Miss Match Comfort',
      color: 'Beige',
      tags: ['cozy', 'knit', 'layering', 'comfortable'],
      displayOrder: 4,
    },
    {
      name: 'Leather Jacket',
      description: 'Edgy black leather jacket',
      category: 'OUTERWEAR',
      subcategory: 'Jackets',
      imageUrl: '/garments/leather-jacket.jpg',
      thumbnailUrl: '/garments/thumbs/leather-jacket.jpg',
      brand: 'Miss Match Edge',
      color: 'Black',
      tags: ['leather', 'edgy', 'jacket', 'cool'],
      displayOrder: 5,
    },
  ];

  for (const garment of sampleGarments) {
    await prisma.garment.upsert({
      where: { name: garment.name },
      update: {},
      create: garment,
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// package.json (complete version)
{
  "name": "miss-match",
  "version": "1.0.0",
  "private": true,
  "description": "AI-powered virtual try-on application",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "postinstall": "prisma generate",
    "clean": "rimraf .next",
    "analyze": "ANALYZE=true next build"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "typescript": "^5.3.3",
    
    "prisma": "^5.8.0",
    "@prisma/client": "^5.8.0",
    
    "@vercel/blob": "^0.23.0",
    
    "@clerk/nextjs": "^5.0.0",
    
    "zod": "^3.22.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    
    "lucide-react": "^0.323.0",
    "react-dropzone": "^14.2.3",
    
    "sharp": "^0.33.2",
    "exif-parser": "^0.1.12"
  },
  "devDependencies": {
    "eslint": "^8.56.0",
    "eslint-config-next": "14.2.0",
    "@types/exif-parser": "^0.1.5",
    "tsx": "^4.7.0",
    "rimraf": "^5.0.5",
    "@next/bundle-analyzer": "^14.1.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/miss-match.git"
  },
  "keywords": [
    "virtual-try-on",
    "ai",
    "fashion",
    "nextjs",
    "typescript",
    "prisma",
    "vercel"
  ],
  "author": "Miss Match Team",
  "license": "MIT"
}

// src/app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'BLOB_READ_WRITE_TOKEN',
      'TRYON_DRIVER',
    ];
    
    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Missing environment variables: ${missingEnvVars.join(', ')}` 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
      storage: 'configured',
      driver: process.env.TRYON_DRIVER,
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// README.md
# Miss Match - AI Virtual Try-On

Upload your photo and try on clothes with AI. See how garments look on you instantly while preserving your original background.

## Features

- 🤖 **AI-Powered Try-On**: Advanced virtual try-on using Flux and Nano Banana models
- 🔒 **Privacy-First**: Images automatically deleted after 30 days
- ⚡ **Fast Processing**: Results in 30-60 seconds
- 🎯 **Background Preservation**: Keep your original background intact
- 📱 **Responsive Design**: Works on desktop and mobile
- 🛡️ **NSFW Protection**: Automatic content filtering
- 🔧 **Swappable Models**: Easy switching between AI providers

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Storage**: Vercel Blob Storage
- **AI Models**: Flux, Nano Banana (swappable)
- **Auth**: Clerk (optional for v1)
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Vercel account (for deployment)

### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your database URL, Blob storage token, and AI API keys
3. Set `TRYON_DRIVER` to either `flux` or `nanobanana`

### Installation

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

### Manual Steps

1. Set up PostgreSQL database
2. Configure Vercel Blob storage
3. Add cleanup cron job for 30-day retention

## API Endpoints

- `POST /api/images/upload` - Upload and validate images
- `GET /api/garments` - Browse garment library
- `POST /api/tryon/generate` - Start try-on generation
- `GET /api/tryon/status/[id]` - Check processing status
- `POST /api/webhooks/tryon/*` - Webhooks for AI providers

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Frontend      │    │  Next.js     │    │  AI Providers   │
│   (React/TS)    │◄──►│  API Routes  │◄──►│  (Flux/Nano)    │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                         ┌────▼────┐         ┌─────────────────┐
                         │ Prisma  │◄───────►│   PostgreSQL    │
                         │   ORM   │         │   Database      │
                         └─────────┘         └─────────────────┘
                              │
                         ┌────▼────┐
                         │ Vercel  │
                         │  Blob   │
                         └─────────┘
```

## Adding New AI Providers

1. Create new driver in `src/lib/tryon/drivers/`
2. Extend the factory in `src/lib/tryon/factory.ts`
3. Add webhook endpoint in `src/app/api/webhooks/tryon/`
4. Update environment variables

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## Support

- Documentation: Check the `/docs` folder
- Issues: GitHub Issues
- Discussions: GitHub Discussions