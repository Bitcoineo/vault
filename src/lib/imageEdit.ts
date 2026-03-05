import { db } from "@/db";
import { files, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyFileOwnership } from "./permissions";
import {
  uploadBuffer,
  s3Client,
  BUCKET,
} from "./r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

interface RotateOp {
  type: "rotate";
  degrees: 90 | 180 | 270;
}

interface CropOp {
  type: "crop";
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResizeOp {
  type: "resize";
  width: number;
  height?: number;
}

type EditOperation = RotateOp | CropOp | ResizeOp;

async function streamToBuffer(
  stream: AsyncIterable<Uint8Array>
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function editImage(
  fileId: string,
  userId: string,
  operations: EditOperation[],
  mode: "copy" | "overwrite"
): Promise<{ data: typeof files.$inferSelect | null; error: string | null }> {
  const { data: file, error } = await verifyFileOwnership(fileId, userId);
  if (error || !file) return { data: null, error: error || "File not found" };

  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimeType)) {
    return { data: null, error: "File is not an editable image" };
  }

  // Fetch original from R2
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: file.key })
  );
  const buffer = await streamToBuffer(
    response.Body as AsyncIterable<Uint8Array>
  );

  const sharp = (await import("sharp")).default;
  let pipeline = sharp(buffer);

  // Apply operations in order
  for (const op of operations) {
    switch (op.type) {
      case "rotate":
        pipeline = pipeline.rotate(op.degrees);
        break;
      case "crop":
        pipeline = pipeline.extract({
          left: Math.round(op.x),
          top: Math.round(op.y),
          width: Math.round(op.width),
          height: Math.round(op.height),
        });
        break;
      case "resize":
        pipeline = pipeline.resize(
          Math.round(op.width),
          op.height ? Math.round(op.height) : undefined
        );
        break;
    }
  }

  const editedBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
  const metadata = await sharp(editedBuffer).metadata();

  // Generate thumbnail
  const thumbBuffer = await sharp(editedBuffer)
    .resize(400)
    .webp({ quality: 80 })
    .toBuffer();

  if (mode === "overwrite") {
    // Replace original
    await uploadBuffer(file.key, editedBuffer, "image/webp");

    const thumbKey = file.thumbnailKey || `${file.key}-thumb.webp`;
    await uploadBuffer(thumbKey, thumbBuffer, "image/webp");

    // Update storage delta
    const sizeDelta = editedBuffer.length - file.size;
    await db
      .update(users)
      .set({
        storageUsed: sql`MAX(0, ${users.storageUsed} + ${sizeDelta})`,
      })
      .where(eq(users.id, userId));

    await db
      .update(files)
      .set({
        size: editedBuffer.length,
        mimeType: "image/webp",
        width: metadata.width || null,
        height: metadata.height || null,
        thumbnailKey: thumbKey,
        updatedAt: new Date(),
      })
      .where(eq(files.id, fileId));

    const updated = await db.query.files.findFirst({
      where: eq(files.id, fileId),
    });
    return { data: updated || null, error: null };
  } else {
    // Save as copy
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const newName = `${baseName}-edited.webp`;
    const newKey = `${userId}/${nanoid()}-edited.webp`;
    const newThumbKey = `${newKey}-thumb.webp`;
    const newId = nanoid();

    await uploadBuffer(newKey, editedBuffer, "image/webp");
    await uploadBuffer(newThumbKey, thumbBuffer, "image/webp");

    await db.insert(files).values({
      id: newId,
      userId,
      folderId: file.folderId,
      name: newName,
      key: newKey,
      thumbnailKey: newThumbKey,
      mimeType: "image/webp",
      size: editedBuffer.length,
      width: metadata.width || null,
      height: metadata.height || null,
      status: "ready",
    });

    await db
      .update(users)
      .set({
        storageUsed: sql`${users.storageUsed} + ${editedBuffer.length}`,
      })
      .where(eq(users.id, userId));

    const newFile = await db.query.files.findFirst({
      where: eq(files.id, newId),
    });
    return { data: newFile || null, error: null };
  }
}
