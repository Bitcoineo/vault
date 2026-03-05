import { auth } from "../../../../../../auth";
import { compressImage } from "@/lib/compress";

export async function POST(
  req: Request,
  { params }: { params: { fileId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const quality = typeof body.quality === "number" ? body.quality : 80;
  const format = ["original", "webp", "jpeg"].includes(body.format)
    ? body.format
    : "webp";

  const result = await compressImage(
    params.fileId,
    session.user.id,
    quality,
    format
  );
  if (result.error) {
    return Response.json(result, { status: 400 });
  }

  return Response.json(result);
}
