import { db } from "@/db";
import { files, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyFileOwnership } from "./permissions";
import { uploadBuffer, s3Client, BUCKET } from "./r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

async function streamToBuffer(
  stream: AsyncIterable<Uint8Array>
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function compressImage(
  fileId: string,
  userId: string
): Promise<{
  data: {
    file: typeof files.$inferSelect;
    originalSize: number;
    compressedSize: number;
  } | null;
  error: string | null;
}> {
  const { data: file, error } = await verifyFileOwnership(fileId, userId);
  if (error || !file) return { data: null, error: error || "File not found" };

  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimeType)) {
    return { data: null, error: "File is not a compressible image" };
  }

  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: file.key })
  );
  const buffer = await streamToBuffer(
    response.Body as AsyncIterable<Uint8Array>
  );

  const sharp = (await import("sharp")).default;
  const compressed = await sharp(buffer).webp({ quality: 80 }).toBuffer();
  const metadata = await sharp(compressed).metadata();

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const newName = `${baseName}-compressed.webp`;
  const newKey = `${userId}/${nanoid()}-compressed.webp`;
  const newId = nanoid();

  // Generate thumbnail
  const thumb = await sharp(compressed)
    .resize(400)
    .webp({ quality: 80 })
    .toBuffer();
  const thumbKey = `${newKey}-thumb.webp`;

  await uploadBuffer(newKey, compressed, "image/webp");
  await uploadBuffer(thumbKey, thumb, "image/webp");

  await db.insert(files).values({
    id: newId,
    userId,
    folderId: file.folderId,
    name: newName,
    key: newKey,
    thumbnailKey: thumbKey,
    mimeType: "image/webp",
    size: compressed.length,
    width: metadata.width || null,
    height: metadata.height || null,
    status: "ready",
  });

  await db
    .update(users)
    .set({ storageUsed: sql`${users.storageUsed} + ${compressed.length}` })
    .where(eq(users.id, userId));

  const newFile = await db.query.files.findFirst({
    where: eq(files.id, newId),
  });

  return {
    data: {
      file: newFile!,
      originalSize: file.size,
      compressedSize: compressed.length,
    },
    error: null,
  };
}

export async function compressToZip(
  fileIds: string[],
  userId: string
): Promise<{ data: typeof files.$inferSelect | null; error: string | null }> {
  if (!fileIds.length) return { data: null, error: "No files specified" };

  const userFiles = await db
    .select()
    .from(files)
    .where(and(eq(files.userId, userId)));

  const toZip = userFiles.filter((f) => fileIds.includes(f.id));
  if (!toZip.length) return { data: null, error: "No matching files found" };

  const archiver = (await import("archiver")).default;
  const { PassThrough } = await import("stream");

  // Create zip in memory
  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];
  const passThrough = new PassThrough();

  passThrough.on("data", (chunk: Buffer) => chunks.push(chunk));

  const finished = new Promise<void>((resolve, reject) => {
    passThrough.on("end", resolve);
    archive.on("error", reject);
  });

  archive.pipe(passThrough);

  // Add each file to the archive
  for (const file of toZip) {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: file.key })
    );
    const buffer = await streamToBuffer(
      response.Body as AsyncIterable<Uint8Array>
    );
    archive.append(buffer, { name: file.name });
  }

  await archive.finalize();
  await finished;

  const zipBuffer = Buffer.concat(chunks);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
  const zipName = `archive-${timestamp}.zip`;
  const zipKey = `${userId}/${nanoid()}-${zipName}`;
  const zipId = nanoid();

  await uploadBuffer(zipKey, zipBuffer, "application/zip");

  await db.insert(files).values({
    id: zipId,
    userId,
    folderId: toZip[0].folderId,
    name: zipName,
    key: zipKey,
    mimeType: "application/zip",
    size: zipBuffer.length,
    status: "ready",
  });

  await db
    .update(users)
    .set({ storageUsed: sql`${users.storageUsed} + ${zipBuffer.length}` })
    .where(eq(users.id, userId));

  const newFile = await db.query.files.findFirst({
    where: eq(files.id, zipId),
  });

  return { data: newFile || null, error: null };
}
