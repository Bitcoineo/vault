# Vault

A file upload and processing platform with cloud storage, drag-and-drop uploads, background image processing, PDF text extraction, and secure signed URLs.

## Features

- **File Upload** — Drag-and-drop or click to upload files to Cloudflare R2
- **Auto Processing** — Thumbnails generated for images, text extracted from PDFs
- **Folder Organization** — Nested folders with drag-to-move support
- **Search** — Full-text search across file names and extracted PDF text
- **Multi-Select** — Cmd/Ctrl+click and Shift+click for bulk operations
- **Secure Access** — Signed URLs with 1-hour expiry, all files private by default
- **Responsive** — Works on mobile and desktop
- **Themes** — Light, dim, and dark themes

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Drizzle ORM** + Turso (LibSQL)
- **Auth.js v5** (Google OAuth + credentials)
- **Cloudflare R2** (S3-compatible) via AWS SDK
- **Sharp** for image processing
- **pdf-parse** for PDF text extraction
- **Tailwind CSS**

## Setup

1. Clone the repo
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and fill in values
4. Push the database schema: `pnpm db:push`
5. Run dev server: `pnpm dev`

## Environment Variables

```
DATABASE_URL=           # Turso database URL
DATABASE_AUTH_TOKEN=    # Turso auth token
AUTH_SECRET=            # Auth.js secret (generate with `openssl rand -base64 32`)
GOOGLE_CLIENT_ID=       # Google OAuth client ID
GOOGLE_CLIENT_SECRET=   # Google OAuth client secret
R2_ACCOUNT_ID=          # Cloudflare account ID
R2_ACCESS_KEY_ID=       # R2 access key
R2_SECRET_ACCESS_KEY=   # R2 secret key
R2_BUCKET_NAME=         # R2 bucket name
R2_PUBLIC_URL=          # R2 public URL (optional)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Limits

- 50 MB per file
- 1 GB total storage per user
