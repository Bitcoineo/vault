import { auth } from "../../../../../../auth";
import { editImage } from "@/lib/imageEdit";

export async function POST(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { operations, mode } = body;

  if (!Array.isArray(operations) || operations.length === 0) {
    return Response.json({ error: "Operations array required" }, { status: 400 });
  }

  if (mode !== "copy" && mode !== "overwrite") {
    return Response.json({ error: "Mode must be 'copy' or 'overwrite'" }, { status: 400 });
  }

  const result = await editImage(params.fileId, session.user.id, operations, mode);
  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
