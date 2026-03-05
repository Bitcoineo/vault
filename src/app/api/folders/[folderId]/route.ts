import { auth } from "../../../../../auth";
import { renameFolder, deleteFolder } from "@/lib/folders";

export async function PATCH(
  req: Request,
  { params }: { params: { folderId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const result = await renameFolder(params.folderId, session.user.id, name);

  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { folderId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deleteFolder(params.folderId, session.user.id);

  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
