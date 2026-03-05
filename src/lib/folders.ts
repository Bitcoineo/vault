import { db } from "@/db";
import { folders, files, users } from "@/db/schema";
import { eq, and, isNull, sql, inArray } from "drizzle-orm";
import { verifyFolderOwnership } from "./permissions";
import { deleteObject } from "./r2";

export async function createFolder(
  userId: string,
  name: string,
  parentId?: string | null
): Promise<{
  data: typeof folders.$inferSelect | null;
  error: string | null;
}> {
  if (!name.trim()) {
    return { data: null, error: "Folder name is required" };
  }

  if (parentId) {
    const { error } = await verifyFolderOwnership(parentId, userId);
    if (error) return { data: null, error };
  }

  const [folder] = await db
    .insert(folders)
    .values({
      userId,
      name: name.trim(),
      parentId: parentId || null,
    })
    .returning();

  return { data: folder, error: null };
}

export async function getUserFolders(
  userId: string,
  parentId?: string | null
): Promise<{
  data: (typeof folders.$inferSelect)[];
  error: string | null;
}> {
  const condition = parentId
    ? and(eq(folders.userId, userId), eq(folders.parentId, parentId))
    : and(eq(folders.userId, userId), isNull(folders.parentId));

  const result = await db.select().from(folders).where(condition).orderBy(folders.name);

  return { data: result, error: null };
}

export async function renameFolder(
  folderId: string,
  userId: string,
  name: string
): Promise<{
  data: typeof folders.$inferSelect | null;
  error: string | null;
}> {
  if (!name.trim()) {
    return { data: null, error: "Folder name is required" };
  }

  const { data: folder, error } = await verifyFolderOwnership(
    folderId,
    userId
  );
  if (error || !folder) {
    return { data: null, error: error || "Folder not found" };
  }

  const [updated] = await db
    .update(folders)
    .set({ name: name.trim(), updatedAt: new Date() })
    .where(eq(folders.id, folderId))
    .returning();

  return { data: updated, error: null };
}

async function collectFolderIds(folderId: string): Promise<string[]> {
  const ids = [folderId];
  const children = await db
    .select({ id: folders.id })
    .from(folders)
    .where(eq(folders.parentId, folderId));

  for (const child of children) {
    const childIds = await collectFolderIds(child.id);
    ids.push(...childIds);
  }

  return ids;
}

export async function deleteFolder(
  folderId: string,
  userId: string
): Promise<{ data: { success: boolean } | null; error: string | null }> {
  const { error } = await verifyFolderOwnership(folderId, userId);
  if (error) return { data: null, error };

  const allFolderIds = await collectFolderIds(folderId);

  // Get all files in these folders
  const allFiles = await db
    .select()
    .from(files)
    .where(inArray(files.folderId, allFolderIds));

  // Delete R2 objects
  for (const file of allFiles) {
    await deleteObject(file.key);
    if (file.thumbnailKey) {
      await deleteObject(file.thumbnailKey);
    }
  }

  const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);

  // Delete files in these folders
  if (allFiles.length > 0) {
    await db.delete(files).where(inArray(files.folderId, allFolderIds));
  }

  // Delete folders (children first due to FK constraints)
  for (const id of allFolderIds.reverse()) {
    await db.delete(folders).where(eq(folders.id, id));
  }

  // Update storage
  if (totalSize > 0) {
    await db
      .update(users)
      .set({
        storageUsed: sql`MAX(0, ${users.storageUsed} - ${totalSize})`,
      })
      .where(eq(users.id, userId));
  }

  return { data: { success: true }, error: null };
}

export async function getFolderPath(
  folderId: string,
  userId: string
): Promise<{
  data: { id: string; name: string }[];
  error: string | null;
}> {
  const path: { id: string; name: string }[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const found: { id: string; name: string; parentId: string | null } | undefined =
      await db.query.folders.findFirst({
        where: and(eq(folders.id, currentId), eq(folders.userId, userId)),
        columns: { id: true, name: true, parentId: true },
      });

    if (!found) {
      return { data: [], error: "Folder not found" };
    }

    path.unshift({ id: found.id, name: found.name });
    currentId = found.parentId;
  }

  return { data: path, error: null };
}
