import { db } from "@/db";
import { files, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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

export async function removeBackground(
  fileId: string,
  userId: string
): Promise<{
  data: { file: typeof files.$inferSelect } | null;
  error: string | null;
}> {
  const { data: file, error } = await verifyFileOwnership(fileId, userId);
  if (error || !file) return { data: null, error: error || "File not found" };

  if (!/^image\/(jpeg|png|webp)$/.test(file.mimeType)) {
    return { data: null, error: "Only JPEG, PNG, and WebP images are supported" };
  }

  // Fetch original from R2
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: file.key })
  );
  const buffer = await streamToBuffer(
    response.Body as AsyncIterable<Uint8Array>
  );

  // Remove background using @imgly/background-removal-node
  const { removeBackground: removeBg } = await import(
    "@imgly/background-removal-node"
  );
  const blob = new Blob([new Uint8Array(buffer)], { type: file.mimeType });
  const resultBlob = await removeBg(blob, {
    output: { format: "image/png", quality: 0.9 },
  });

  const resultArrayBuffer = await resultBlob.arrayBuffer();
  const resultBuffer = Buffer.from(resultArrayBuffer);

  const sharp = (await import("sharp")).default;
  const metadata = await sharp(resultBuffer).metadata();

  // Generate thumbnail
  const thumbBuffer = await sharp(resultBuffer)
    .resize(400)
    .png()
    .toBuffer();

  const baseName = file.name.replace(/\.[^.]+$/, "");
  const newName = `${baseName}-nobg.png`;
  const newKey = `${userId}/${nanoid()}-nobg.png`;
  const thumbKey = `${newKey}-thumb.png`;
  const newId = nanoid();

  await uploadBuffer(newKey, resultBuffer, "image/png");
  await uploadBuffer(thumbKey, thumbBuffer, "image/png");

  await db.insert(files).values({
    id: newId,
    userId,
    folderId: file.folderId,
    name: newName,
    key: newKey,
    thumbnailKey: thumbKey,
    mimeType: "image/png",
    size: resultBuffer.length,
    width: metadata.width || null,
    height: metadata.height || null,
    status: "ready",
  });

  await db
    .update(users)
    .set({
      storageUsed: sql`${users.storageUsed} + ${resultBuffer.length}`,
    })
    .where(eq(users.id, userId));

  const newFile = await db.query.files.findFirst({
    where: eq(files.id, newId),
  });

  return { data: { file: newFile! }, error: null };
}
