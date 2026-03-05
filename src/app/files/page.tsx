import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { getUserFiles } from "@/lib/files";
import { getUserFolders, getFolderPath } from "@/lib/folders";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FileBrowser } from "@/components/files/FileBrowser";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: { folderId?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const folderId = searchParams.folderId || null;

  const [filesResult, foldersResult, pathResult, user] = await Promise.all([
    getUserFiles(session.user.id, folderId),
    getUserFolders(session.user.id, folderId),
    folderId
      ? getFolderPath(folderId, session.user.id)
      : Promise.resolve({ data: [], error: null }),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { storageUsed: true, name: true, avatarColor: true },
    }),
  ]);

  return (
    <FileBrowser
      initialFiles={filesResult.data}
      initialFolders={foldersResult.data}
      folderPath={pathResult.data}
      currentFolderId={folderId}
      storageUsed={user?.storageUsed || 0}
      userName={user?.name || session.user.name || null}
      avatarColor={user?.avatarColor || null}
    />
  );
}
