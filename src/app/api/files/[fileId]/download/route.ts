import { auth } from "../../../../../../auth";
import { getFileDownloadUrl } from "@/lib/files";

export async function GET(
  _req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getFileDownloadUrl(params.fileId, session.user.id);

  if (result.error) {
    return Response.json(result, { status: 404 });
  }

  return Response.json(result);
}
