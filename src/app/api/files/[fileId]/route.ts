import { auth } from "../../../../../auth";
import { getFileById, deleteFile, renameFile, moveFile } from "@/lib/files";

export async function GET(
  _req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getFileById(params.fileId, session.user.id);

  if (result.error) {
    return Response.json(result, { status: 404 });
  }

  return Response.json(result);
}

export async function PATCH(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (typeof body.name === "string") {
    const result = await renameFile(params.fileId, session.user.id, body.name);
    if (result.error) return Response.json(result, { status: 400 });
    return Response.json(result);
  }

  if ("folderId" in body) {
    const result = await moveFile(params.fileId, session.user.id, body.folderId);
    if (result.error) return Response.json(result, { status: 400 });
    return Response.json(result);
  }

  return Response.json({ error: "No valid fields to update" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await deleteFile(params.fileId, session.user.id);

  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
