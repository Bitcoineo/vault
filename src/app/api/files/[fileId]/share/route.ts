import { auth } from "../../../../../../auth";
import { createShareLink, getActiveShareLinks } from "@/lib/sharing";

export async function POST(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { expiresIn } = body;

  if (!["1h", "24h", "7d"].includes(expiresIn)) {
    return Response.json(
      { error: "Invalid expiresIn value" },
      { status: 400 }
    );
  }

  const result = await createShareLink(params.fileId, session.user.id, expiresIn);
  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}

export async function GET(
  _req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getActiveShareLinks(params.fileId, session.user.id);
  return Response.json(result);
}
