import { auth } from "../../../../../../auth";
import { getFolderPath } from "@/lib/folders";

export async function GET(
  _req: Request,
  { params }: { params: { folderId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getFolderPath(params.folderId, session.user.id);

  if (result.error) {
    return Response.json(result, { status: 404 });
  }

  return Response.json(result);
}
