import { db } from "@/db";
import { sharedLinks, files } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { verifyFileOwnership } from "./permissions";
import { getDownloadUrl } from "./r2";

type ExpiresIn = "1h" | "24h" | "7d";

function getExpiryDate(expiresIn: ExpiresIn): Date {
  const now = new Date();
  switch (expiresIn) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "24h":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

export async function createShareLink(
  fileId: string,
  userId: string,
  expiresIn: ExpiresIn
): Promise<{
  data: { token: string; expiresAt: string } | null;
  error: string | null;
}> {
  const { error } = await verifyFileOwnership(fileId, userId);
  if (error) return { data: null, error };

  const token = nanoid(32);
  const expiresAt = getExpiryDate(expiresIn).toISOString();

  await db.insert(sharedLinks).values({
    fileId,
    token,
    expiresAt,
    createdBy: userId,
  });

  return { data: { token, expiresAt }, error: null };
}

export async function getActiveShareLinks(
  fileId: string,
  userId: string
): Promise<{
  data: { token: string; expiresAt: string; createdAt: Date }[];
  error: string | null;
}> {
  const { error } = await verifyFileOwnership(fileId, userId);
  if (error) return { data: [], error };

  const now = new Date().toISOString();
  const links = await db
    .select()
    .from(sharedLinks)
    .where(
      and(eq(sharedLinks.fileId, fileId), gt(sharedLinks.expiresAt, now))
    );

  return {
    data: links.map((l) => ({
      token: l.token,
      expiresAt: l.expiresAt,
      createdAt: l.createdAt,
    })),
    error: null,
  };
}

export async function resolveShareToken(token: string): Promise<{
  data: {
    file: { name: string; size: number; mimeType: string; key: string };
    downloadUrl: string;
  } | null;
  error: string | null;
}> {
  const link = await db
    .select()
    .from(sharedLinks)
    .where(eq(sharedLinks.token, token))
    .get();

  if (!link) return { data: null, error: "Link not found" };

  if (new Date(link.expiresAt) < new Date()) {
    return { data: null, error: "This link has expired" };
  }

  const file = await db
    .select()
    .from(files)
    .where(eq(files.id, link.fileId))
    .get();

  if (!file) return { data: null, error: "File not found" };

  const downloadUrl = await getDownloadUrl(file.key, 3600);

  return {
    data: {
      file: {
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        key: file.key,
      },
      downloadUrl,
    },
    error: null,
  };
}
