import { auth } from "../../../../auth";
import { getUserFiles } from "@/lib/files";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");

  const result = await getUserFiles(session.user.id, folderId);

  return Response.json(result);
}
