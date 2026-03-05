import { auth } from "../../../../auth";
import { createFolder, getUserFolders } from "@/lib/folders";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, parentId } = await req.json();

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const result = await createFolder(session.user.id, name, parentId);

  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");

  const result = await getUserFolders(session.user.id, parentId);

  return Response.json(result);
}
