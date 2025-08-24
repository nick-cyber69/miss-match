// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id              String   @id @default(cuid())
  clerkId         String?  @unique // Optional for v1
  email           String?  @unique
  firstName       String?
  lastName        String?
  organizationId  String?  // For multi-client support later
  
  // User preferences
  hasConsented    Boolean  @default(false)
  acceptedTermsAt DateTime?
  
  // Relationships
  uploads         Upload[]
  tryOnResults    TryOnResult[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("users")
}

model Upload {
  id            String   @id @default(cuid())
  userId        String?
  user          User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Image metadata
  originalName  String
  fileName      String   @unique
  fileSize      Int
  mimeType      String
  width         Int
  height        Int
  
  // Storage
  blobUrl       String
  thumbnailUrl  String?
  
  // Processing status
  status        UploadStatus @default(PENDING)
  nsfwScore     Float?
  nsfwChecked   Boolean      @default(false)
  
  // Security & compliance
  ipAddress     String?
  userAgent     String?
  exifStripped  Boolean      @default(false)
  
  // Relationships
  tryOnResults  TryOnResult[]
  
  // Cleanup
  expiresAt     DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("uploads")
}

model Garment {
  id              String   @id @default(cuid())
  name            String
  description     String?
  category        GarmentCategory
  subcategory     String?
  
  // Image assets
  imageUrl        String
  thumbnailUrl    String?
  maskUrl         String? // For advanced try-on positioning
  
  // Metadata
  brand           String?
  color           String?
  size            String?
  tags            String[] @default([])
  
  // Availability
  isActive        Boolean  @default(true)
  displayOrder    Int      @default(0)
  
  // Relationships
  tryOnResults    TryOnResult[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("garments")
}

model TryOnResult {
  id              String   @id @default(cuid())
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  uploadId        String
  upload          Upload   @relation(fields: [uploadId], references: [id], onDelete: Cascade)
  
  garmentId       String
  garment         Garment  @relation(fields: [garmentId], references: [id], onDelete: Cascade)
  
  // Processing
  status          ProcessingStatus @default(QUEUED)
  driver          String           // "flux" | "nanobanana"
  
  // Results
  resultUrl       String?
  thumbnailUrl    String?
  processingTime  Int?             // milliseconds
  
  // Error handling
  errorMessage    String?
  retryCount      Int              @default(0)
  maxRetries      Int              @default(3)
  
  // External job tracking
  externalJobId   String?
  webhookReceived Boolean          @default(false)
  
  // Metadata
  processingParams Json?           // Store driver-specific parameters
  qualityScore     Float?          // Result quality assessment
  
  // Cleanup
  expiresAt       DateTime
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@map("tryon_results")
}

model ProcessingJob {
  id              String   @id @default(cuid())
  resultId        String   @unique
  result          TryOnResult @relation(fields: [resultId], references: [id], onDelete: Cascade)
  
  // Job queue management
  priority        Int      @default(0)
  scheduledAt     DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  failedAt        DateTime?
  
  // Resource tracking
  computeUnits    Int?
  costEstimate    Float?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("processing_jobs")
}

// Enums
enum UploadStatus {
  PENDING
  PROCESSING
  APPROVED
  REJECTED
  ERROR
}

enum GarmentCategory {
  TOPS
  BOTTOMS
  DRESSES
  OUTERWEAR
  FOOTWEAR
  ACCESSORIES
}

enum ProcessingStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

// Indexes for performance
model SessionLog {
  id            String   @id @default(cuid())
  sessionId     String
  userId        String?
  action        String
  metadata      Json?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())
  
  @@index([sessionId])
  @@index([userId])
  @@index([createdAt])
  @@map("session_logs")
}