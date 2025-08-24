# Miss Match - Virtual Try-On Application

## Project Structure
```
miss-match/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── images/
│   │   │   │   ├── upload/route.ts
│   │   │   │   └── process/route.ts
│   │   │   ├── garments/route.ts
│   │   │   ├── tryon/
│   │   │   │   ├── generate/route.ts
│   │   │   │   └── status/[id]/route.ts
│   │   │   └── webhooks/
│   │   │       └── cleanup/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── progress.tsx
│   │   │   └── toast.tsx
│   │   ├── forms/
│   │   │   ├── ImageUpload.tsx
│   │   │   ├── GarmentSelector.tsx
│   │   │   └── ConsentForm.tsx
│   │   ├── gallery/
│   │   │   ├── ResultGallery.tsx
│   │   │   └── GarmentGrid.tsx
│   │   └── providers/
│   │       ├── ClerkProvider.tsx
│   │       └── ToastProvider.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── tryon/
│   │   │   ├── drivers/
│   │   │   │   ├── base.ts
│   │   │   │   ├── flux.ts
│   │   │   │   └── nano-banana.ts
│   │   │   ├── factory.ts
│   │   │   └── types.ts
│   │   ├── storage/
│   │   │   ├── blob.ts
│   │   │   └── cleanup.ts
│   │   ├── validation/
│   │   │   ├── image.ts
│   │   │   ├── nsfw.ts
│   │   │   └── schemas.ts
│   │   ├── auth/
│   │   │   └── clerk.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── types/
│       ├── api.ts
│       ├── tryon.ts
│       └── user.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── garments/
│   └── examples/
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── package.json
└── README.md
```

## Environment Variables (.env.example)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/miss_match?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/miss_match?schema=public"

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="your_blob_token"

# Clerk Authentication (Optional for v1)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Try-On Model Configuration
TRYON_DRIVER="flux" # flux | nanobanana
FLUX_API_KEY="your_flux_api_key"
FLUX_API_URL="https://api.flux.ai/v1"
NANO_BANANA_API_KEY="your_nano_banana_key"
NANO_BANANA_API_URL="https://api.nanobanana.ai/v1"

# NSFW Content Filtering
NSFW_API_KEY="your_nsfw_filter_key"
NSFW_THRESHOLD="0.7"

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_MAX_SIZE="10485760" # 10MB
SUPPORTED_IMAGE_TYPES="image/jpeg,image/png,image/webp"
IMAGE_RETENTION_DAYS="30"

# Security
WEBHOOK_SECRET="your_webhook_secret_for_cleanup"
ENCRYPTION_KEY="your_32_character_encryption_key"
```

## Package.json Dependencies
```json
{
  "dependencies": {
    "next": "14.2.0",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "typescript": "^5",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "@vercel/blob": "^0.23.0",
    "@clerk/nextjs": "^5.0.0",
    "zod": "^3.22.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.400.0",
    "react-dropzone": "^14.2.0",
    "sharp": "^0.32.0",
    "exif-parser": "^0.1.12",
    "crypto": "^1.0.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "eslint": "^8",
    "eslint-config-next": "14.2.0"
  }
}
```