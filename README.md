# Vault

Personal cloud storage with file processing built in. Upload files to Cloudflare R2, get auto-generated thumbnails, extract text from PDFs, remove image backgrounds, and share files via signed URLs.

**Stack:** `Next.js 14 · TypeScript · Auth.js v5 · Drizzle ORM · Turso (SQLite) · Cloudflare R2 · Sharp · Tailwind CSS`

**Live:** https://vault-bitcoineo.vercel.app

---

## Why I built this

I wanted to understand how file storage actually works beyond localStorage: uploading to object storage, generating signed URLs with expiry, processing files server-side with Sharp, and extracting text from PDFs. Vault is a full implementation — every file is private by default, served via 1-hour signed URLs, with 1GB per user enforced at the database level.

## Features

- **Cloud storage** Files uploaded directly to Cloudflare R2 via signed URLs
- **Auto thumbnails** Generated server-side with Sharp on image upload
- **PDF text extraction** Full text indexed on upload, searchable across all files
- **Background removal** One-click background removal for images
- **Folder organization** Nested folders with drag-to-move support
- **Bulk operations** Cmd/Ctrl+click and Shift+click multi-select with bulk actions
- **Secure access** Signed URLs with 1-hour expiry, all files private by default
- **File sharing** Token-based share links for individual files
- **Search** Full-text search across file names and extracted PDF content
- **Themes** Light, dim, and dark

## Setup

    pnpm install
    cp .env.example .env

Fill in your .env:

    DATABASE_URL=              # Turso database URL
    DATABASE_AUTH_TOKEN=       # Turso auth token
    AUTH_SECRET=               # openssl rand -base64 32
    GOOGLE_CLIENT_ID=          # Google OAuth client ID
    GOOGLE_CLIENT_SECRET=      # Google OAuth client secret
    R2_ACCOUNT_ID=             # Cloudflare account ID
    R2_ACCESS_KEY_ID=          # R2 access key
    R2_SECRET_ACCESS_KEY=      # R2 secret key
    R2_BUCKET_NAME=            # R2 bucket name
    R2_PUBLIC_URL=             # R2 public URL (optional)
    NEXT_PUBLIC_BASE_URL=      # http://localhost:3000 for dev

Push schema and start:

    pnpm db:push
    pnpm dev

Open http://localhost:3000

## Limits

- 50 MB per file
- 1 GB total storage per user

## GitHub Topics

`nextjs` `typescript` `cloudflare-r2` `file-storage` `sharp` `pdf` `image-processing` `drizzle-orm` `turso` `authjs` `tailwind` `s3`
