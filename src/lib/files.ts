import { db } from "@/db";
import { files, users } from "@/db/schema";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  getDownloadUrl,
  deleteObject,
  uploadBuffer,
  s3Client,
  BUCKET,
} from "./r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { verifyFileOwnership } from "./permissions";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_STORAGE = 1024 * 1024 * 1024; // 1 GB

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100);
}

async function streamToBuffer(
  stream: AsyncIterable<Uint8Array>
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function serverUploadFile(
  userId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  folderId?: string | null
): Promise<{ data: typeof files.$inferSelect | null; error: string | null }> {
  const size = fileBuffer.length;

  if (size > MAX_FILE_SIZE) {
    return { data: null, error: "File size exceeds 50MB limit" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { data: null, error: "User not found" };
  }

  if (user.storageUsed + size > MAX_STORAGE) {
    return { data: null, error: "Storage limit exceeded (1GB)" };
  }

  if (folderId) {
    const { folders } = await import("@/db/schema");
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
    });
    if (!folder) {
      return { data: null, error: "Folder not found" };
    }
  }

  const key = `${userId}/${nanoid()}-${sanitizeFilename(fileName)}`;
  const fileId = nanoid();

  // Insert DB row
  await db.insert(files).values({
    id: fileId,
    userId,
    folderId: folderId || null,
    name: fileName,
    key,
    mimeType,
    size,
    status: "processing",
  });

  // Upload to R2 server-side (no CORS issues)
  try {
    await uploadBuffer(key, fileBuffer, mimeType);
  } catch (err) {
    console.error("R2 upload error:", err);
    await db
      .update(files)
      .set({
        status: "error",
        processingError: err instanceof Error ? err.message : "Upload to storage failed",
        updatedAt: new Date(),
      })
      .where(eq(files.id, fileId));
    return { data: null, error: `Upload to storage failed: ${err instanceof Error ? err.message : "unknown error"}` };
  }

  // Update storage used
  await db
    .update(users)
    .set({ storageUsed: sql`${users.storageUsed} + ${size}` })
    .where(eq(users.id, userId));

  // Process file (thumbnail, text extraction) — never fails the upload
  try {
    await processFile(fileId);
  } catch (err) {
    console.error(`[processFile] Unhandled error for file ${fileId}:`, err);
    // Mark as ready anyway — file is uploaded, just not processed
    await db
      .update(files)
      .set({ status: "ready", updatedAt: new Date() })
      .where(eq(files.id, fileId));
  }

  const updated = await db.query.files.findFirst({
    where: eq(files.id, fileId),
  });

  return { data: updated || null, error: null };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    for (let i = 0; i < trimmed.length; i += maxChars) {
      lines.push(trimmed.substring(i, i + maxChars));
      if (lines.length >= maxLines) return lines;
    }
  }
  return lines;
}

async function generatePdfThumbnail(
  fileName: string,
  extractedText: string | null
): Promise<Buffer> {
  const sharp = (await import("sharp")).default;

  const escapedName = escapeXml(
    fileName.length > 40 ? fileName.substring(0, 37) + "..." : fileName
  );

  const textLinesSvg = extractedText
    ? wrapText(extractedText, 50, 10)
        .map(
          (line, i) =>
            `<text x="20" y="${110 + i * 16}" font-size="10" fill="#999999" font-family="monospace">${escapeXml(line)}</text>`
        )
        .join("\n")
    : "";

  const svg = `<svg width="400" height="560" xmlns="http://www.w3.org/2000/svg">
<rect width="400" height="560" fill="white"/>
<rect width="400" height="4" fill="#F97316"/>
<text x="20" y="40" font-size="14" font-weight="bold" fill="#2D2D2D" font-family="sans-serif">${escapedName}</text>
<text x="20" y="70" font-size="11" fill="#6B6B6B" font-family="sans-serif">PDF Document</text>
${textLinesSvg}
</svg>`;

  return sharp(Buffer.from(svg)).resize(400, 560).webp({ quality: 80 }).toBuffer();
}

export async function processFile(fileId: string): Promise<void> {
  const file = await db.query.files.findFirst({
    where: eq(files.id, fileId),
  });

  if (!file) return;

  try {
    const isImage = /^image\/(jpeg|png|webp|gif)$/.test(file.mimeType);
    const isPdf = file.mimeType === "application/pdf";

    if (isImage) {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: file.key })
      );

      const buffer = await streamToBuffer(
        response.Body as AsyncIterable<Uint8Array>
      );

      const sharp = (await import("sharp")).default;
      const metadata = await sharp(buffer).metadata();

      const thumbnail = await sharp(buffer)
        .resize(400)
        .webp({ quality: 80 })
        .toBuffer();

      const thumbnailKey = `${file.key}-thumb.webp`;
      await uploadBuffer(thumbnailKey, thumbnail, "image/webp");

      await db
        .update(files)
        .set({
          width: metadata.width || null,
          height: metadata.height || null,
          thumbnailKey,
          status: "ready",
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileId));
    } else if (isPdf) {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET, Key: file.key })
      );

      const buffer = await streamToBuffer(
        response.Body as AsyncIterable<Uint8Array>
      );

      // Extract text
      let extractedText: string | null = null;
      try {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const pdfData = await parser.getText();
        extractedText = pdfData.text.substring(0, 10000);
      } catch (textErr) {
        console.error(`[processFile] PDF text extraction failed for ${fileId}:`, textErr);
      }

      // Generate preview card thumbnail with Sharp
      let thumbnailKey: string | null = null;
      try {
        console.log(`[processFile] Generating PDF thumbnail for ${fileId}...`);
        const thumb = await generatePdfThumbnail(file.name, extractedText);
        console.log(`[processFile] Thumbnail buffer generated: ${thumb.length} bytes`);
        const thumbKey = `${file.key}-thumb.webp`;
        await uploadBuffer(thumbKey, thumb, "image/webp");
        console.log(`[processFile] Thumbnail uploaded to R2: ${thumbKey}`);
        thumbnailKey = thumbKey;
      } catch (thumbErr) {
        console.error(`[processFile] PDF thumbnail failed for ${fileId}:`, thumbErr);
      }

      console.log(`[processFile] PDF complete:`, {
        fileId,
        thumbnailKey,
        hasText: !!extractedText,
        textLength: extractedText?.length ?? 0,
      });

      await db
        .update(files)
        .set({
          extractedText,
          thumbnailKey,
          status: "ready",
          updatedAt: new Date(),
        })
        .where(eq(files.id, fileId));
    } else {
      await db
        .update(files)
        .set({ status: "ready", updatedAt: new Date() })
        .where(eq(files.id, fileId));
    }
  } catch (err) {
    console.error(`[processFile] Error processing file ${fileId}:`, err);
    // Mark as ready anyway — file is uploaded and usable, just without processing
    await db
      .update(files)
      .set({
        status: "ready",
        processingError:
          err instanceof Error ? err.message : "Processing failed",
        updatedAt: new Date(),
      })
      .where(eq(files.id, fileId));
  }
}

export async function getUserFiles(
  userId: string,
  folderId?: string | null
): Promise<{
  data: (typeof files.$inferSelect)[];
  error: string | null;
}> {
  const condition = folderId
    ? and(eq(files.userId, userId), eq(files.folderId, folderId))
    : and(eq(files.userId, userId), isNull(files.folderId));

  const result = await db
    .select()
    .from(files)
    .where(condition)
    .orderBy(desc(files.createdAt));

  return { data: result, error: null };
}

export async function getFileById(
  fileId: string,
  userId: string
): Promise<{ data: typeof files.$inferSelect | null; error: string | null }> {
  return verifyFileOwnership(fileId, userId);
}

export async function deleteFile(
  fileId: string,
  userId: string
): Promise<{ data: { success: boolean } | null; error: string | null }> {
  const { data: file, error } = await verifyFileOwnership(fileId, userId);
  if (error || !file) {
    return { data: null, error: error || "File not found" };
  }

  await deleteObject(file.key);
  if (file.thumbnailKey) {
    await deleteObject(file.thumbnailKey);
  }

  await db
    .update(users)
    .set({ storageUsed: sql`MAX(0, ${users.storageUsed} - ${file.size})` })
    .where(eq(users.id, userId));

  await db.delete(files).where(eq(files.id, fileId));

  return { data: { success: true }, error: null };
}

export async function getFileDownloadUrl(
  fileId: string,
  userId: string
): Promise<{
  data: { url: string; fileName: string } | null;
  error: string | null;
}> {
  const { data: file, error } = await verifyFileOwnership(fileId, userId);
  if (error || !file) {
    return { data: null, error: error || "File not found" };
  }

  const url = await getDownloadUrl(file.key);
  return { data: { url, fileName: file.name }, error: null };
}

export async function renameFile(
  fileId: string,
  userId: string,
  name: string
): Promise<{ data: typeof files.$inferSelect | null; error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: "Name cannot be empty" };
  if (trimmed.length > 255) return { data: null, error: "Name too long" };

  const { data: file, error } = await verifyFileOwnership(fileId, userId);
  if (error || !file) return { data: null, error: error || "File not found" };

  await db
    .update(files)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(files.id, fileId));

  return { data: { ...file, name: trimmed }, error: null };
}

export async function moveFile(
  fileId: string,
  userId: string,
  folderId: string | null
): Promise<{ data: typeof files.$inferSelect | null; error: string | null }> {
  const { data: file, error } = await verifyFileOwnership(fileId, userId);
  if (error || !file) return { data: null, error: error || "File not found" };

  if (folderId) {
    const { verifyFolderOwnership } = await import("./permissions");
    const { error: folderErr } = await verifyFolderOwnership(folderId, userId);
    if (folderErr) return { data: null, error: folderErr };
  }

  await db
    .update(files)
    .set({ folderId, updatedAt: new Date() })
    .where(eq(files.id, fileId));

  return { data: { ...file, folderId }, error: null };
}

export async function bulkDeleteFiles(
  fileIds: string[],
  userId: string
): Promise<{ data: { deleted: number } | null; error: string | null }> {
  if (!fileIds.length) return { data: null, error: "No files specified" };

  const userFiles = await db
    .select()
    .from(files)
    .where(and(eq(files.userId, userId)));

  const toDelete = userFiles.filter((f) => fileIds.includes(f.id));
  if (!toDelete.length) return { data: null, error: "No matching files found" };

  let totalSize = 0;
  for (const file of toDelete) {
    await deleteObject(file.key);
    if (file.thumbnailKey) await deleteObject(file.thumbnailKey);
    await db.delete(files).where(eq(files.id, file.id));
    totalSize += file.size;
  }

  await db
    .update(users)
    .set({ storageUsed: sql`MAX(0, ${users.storageUsed} - ${totalSize})` })
    .where(eq(users.id, userId));

  return { data: { deleted: toDelete.length }, error: null };
}

export async function searchFiles(
  userId: string,
  query: string
): Promise<{ data: (typeof files.$inferSelect)[]; error: string | null }> {
  const pattern = `%${query}%`;
  const results = await db
    .select()
    .from(files)
    .where(
      and(
        eq(files.userId, userId),
        sql`(${files.name} LIKE ${pattern} OR ${files.extractedText} LIKE ${pattern})`
      )
    )
    .orderBy(desc(files.createdAt));

  return { data: results, error: null };
}

export async function getFileThumbnailUrl(
  fileId: string,
  userId: string
): Promise<{ data: { url: string } | null; error: string | null }> {
  const { data: file, error } = await verifyFileOwnership(fileId, userId);
  if (error || !file) {
    return { data: null, error: error || "File not found" };
  }

  if (!file.thumbnailKey) {
    return { data: null, error: "No thumbnail available" };
  }

  const url = await getDownloadUrl(file.thumbnailKey);
  return { data: { url }, error: null };
}
