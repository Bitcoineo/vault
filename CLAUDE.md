# Vault — File Upload & Processing Platform

## Overview
A file management app with cloud storage (Cloudflare R2), drag-and-drop uploads, background image processing, PDF text extraction, thumbnail generation, and signed URLs for secure downloads.

## Tech Stack
- Next.js 14 (App Router), TypeScript strict
- Drizzle ORM + Turso (LibSQL)
- Auth.js v5 (Google OAuth + credentials), JWT strategy
- Cloudflare R2 (S3-compatible) via @aws-sdk/client-s3
- Sharp (image processing), pdf-parse (PDF text extraction)
- Tailwind CSS, pnpm

## Database Schema

### Auth Tables (standard Auth.js)
- user, account, session, verificationToken

### Extended User Fields
- `avatarColor` (text, nullable)
- `storageUsed` (integer, default 0, bytes)

### folder
- `id` (nanoid), `userId` (FK user), `name`, `parentId` (FK folder, nullable — for nesting), `createdAt`, `updatedAt`

### file
- `id` (nanoid), `userId` (FK user), `folderId` (FK folder, nullable — root level if null)
- `name` (text — original filename)
- `key` (text, unique — R2 object key)
- `thumbnailKey` (text, nullable — R2 key for thumbnail)
- `mimeType` (text)
- `size` (integer — bytes)
- `width` (integer, nullable — for images)
- `height` (integer, nullable — for images)
- `extractedText` (text, nullable — for PDFs)
- `status` (text: uploading/processing/ready/error, default 'uploading')
- `processingError` (text, nullable)
- `createdAt`, `updatedAt`
- Index on `(userId, folderId)` for listing
- Index on `(userId, status)` for processing queue

## Key Architecture Decisions
- R2 accessed via AWS S3 SDK (@aws-sdk/client-s3) — R2 is S3-compatible
- Uploads: client POSTs file as FormData to `/api/files/upload` → server uploads to R2 via SDK (avoids CORS issues with presigned PUT URLs)
- Downloads: presigned GET URLs (1-hour expiry) — no CORS issues since browser navigates/fetches directly
- Processing: after server upload, server processes synchronously — generate thumbnail (Sharp), extract text (pdf-parse), extract image metadata
- **R2 CORS note**: If switching to direct-to-R2 uploads in production, configure CORS on the R2 bucket in Cloudflare dashboard:
  - Allowed origins: your app domain
  - Allowed methods: PUT
  - Allowed headers: Content-Type
  - Max age: 3600
- Thumbnails: 400px wide WebP, stored as separate R2 object
- Signed URLs: GET presigned URLs with 1-hour expiry for downloads/previews
- File size limit: 50MB per file, 1GB total per user
- Supported types: images (jpg, png, gif, webp, svg), documents (pdf, txt, md), archives (zip)

## Processing Pipeline
1. Client requests presigned upload URL from server
2. Client uploads directly to R2 using presigned URL
3. Client notifies server upload is complete
4. Server updates file status to 'processing'
5. Server processes based on mimeType:
   - Images: Sharp → generate 400px WebP thumbnail, extract dimensions/metadata
   - PDFs: pdf-parse → extract text content
   - Other: mark as ready (no processing needed)
6. Server updates file status to 'ready' (or 'error')

## API Routes
- Auth: signup, signin (reuse patterns)
- Files: upload URL, confirm upload, list, get, delete, download URL
- Folders: CRUD, list contents
- Search: full-text search across file names + extracted text

## Coding Standards
- Lib layer for all DB/business logic, `{data, error}` return pattern
- All queries scoped to `userId` (personal file storage, not multi-tenant)
- File operations always verify ownership
- Edge-compatible auth split: `auth.config.ts` (Edge) + `auth.ts` (Node)
- nanoid for all entity IDs
- Strict TypeScript, no `any`

## Project Structure
```
src/
  app/              # Next.js App Router pages & API routes
  components/       # React components
  db/
    schema.ts       # Drizzle schema (all tables)
    index.ts        # Turso client
    migrate.ts      # Migration runner
    seed.ts         # Test data seeder
  lib/
    r2.ts           # R2/S3 client & helpers
    permissions.ts  # Ownership check helpers
middleware.ts       # Auth route protection
auth.ts             # Auth.js config (Node runtime)
auth.config.ts      # Auth.js config (Edge-compatible)
drizzle.config.ts   # Drizzle Kit config
```

## Environment Variables
```
DATABASE_URL=
DATABASE_AUTH_TOKEN=
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
