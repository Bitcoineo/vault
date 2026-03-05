import { auth } from "../../../../../../auth";
import { removeBackground } from "@/lib/backgroundRemoval";

export async function POST(
  _req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await removeBackground(params.fileId, session.user.id);
  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
