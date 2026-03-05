import { auth } from "../../../../../auth";
import { serverUploadFile } from "@/lib/files";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[upload] Receiving file: ${file.name} (${file.size} bytes, ${file.type})`);

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await serverUploadFile(
      session.user.id,
      file.name,
      file.type || "application/octet-stream",
      buffer,
      folderId || undefined
    );

    if (result.error) {
      console.error(`[upload] serverUploadFile error:`, result.error);
      return Response.json(result, { status: 400 });
    }

    console.log(`[upload] Success: ${file.name} → status=${result.data?.status}`);
    return Response.json(result);
  } catch (err) {
    console.error("[upload] Unhandled route error:", err);
    return Response.json(
      {
        error: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}`,
      },
      { status: 500 }
    );
  }
}
