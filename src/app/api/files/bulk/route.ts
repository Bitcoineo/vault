import { auth } from "../../../../../auth";
import { bulkDeleteFiles } from "@/lib/files";

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fileIds } = body;

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return Response.json({ error: "fileIds array is required" }, { status: 400 });
  }

  const result = await bulkDeleteFiles(fileIds, session.user.id);
  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
