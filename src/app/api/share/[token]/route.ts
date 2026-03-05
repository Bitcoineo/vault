import { resolveShareToken } from "@/lib/sharing";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const result = await resolveShareToken(params.token);

  if (result.error) {
    return Response.json(result, { status: result.error === "This link has expired" ? 410 : 404 });
  }

  return Response.json(result);
}
