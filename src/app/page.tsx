import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing/LandingContent";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/files");

  return <LandingContent />;
}
