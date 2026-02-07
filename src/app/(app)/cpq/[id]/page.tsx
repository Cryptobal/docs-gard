/**
 * CPQ Quote Detail page
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { CpqQuoteDetail } from "@/components/cpq/CpqQuoteDetail";

export default async function CpqQuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/opai/login?callbackUrl=/cpq/${params.id}`);
  }

  if (!hasAppAccess(session.user.role, "cpq")) {
    redirect("/hub");
  }

  return <CpqQuoteDetail quoteId={params.id} />;
}
