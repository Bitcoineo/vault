import { db } from "@/db";
import { files, folders } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function verifyFileOwnership(
  fileId: string,
  userId: string
): Promise<{ data: typeof files.$inferSelect | null; error: string | null }> {
  const file = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .get();

  if (!file) {
    return { data: null, error: "File not found" };
  }

  return { data: file, error: null };
}

export async function verifyFolderOwnership(
  folderId: string,
  userId: string
): Promise<{
  data: typeof folders.$inferSelect | null;
  error: string | null;
}> {
  const folder = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, folderId), eq(folders.userId, userId)))
    .get();

  if (!folder) {
    return { data: null, error: "Folder not found" };
  }

  return { data: folder, error: null };
}
