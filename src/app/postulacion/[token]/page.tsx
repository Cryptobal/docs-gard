import { notFound } from "next/navigation";
import { PostulacionPublicForm } from "@/components/public/PostulacionPublicForm";
import { isValidPostulacionToken } from "@/lib/postulacion-token";

export const dynamic = "force-dynamic";

export default async function PostulacionPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!isValidPostulacionToken(token)) {
    notFound();
  }

  return <PostulacionPublicForm token={token} />;
}
