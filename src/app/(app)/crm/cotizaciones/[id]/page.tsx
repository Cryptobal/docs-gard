/**
 * CRM - Detalle de Cotización (CPQ)
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { CpqQuoteDetail } from "@/components/cpq/CpqQuoteDetail";
import { CrmSubnav } from "@/components/crm/CrmSubnav";

export default async function CrmCotizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/opai/login?callbackUrl=/crm/cotizaciones/${id}`);
  }

  if (!hasAppAccess(session.user.role, "crm")) {
    redirect("/hub");
  }

  return (
    <>
      <CrmSubnav />
      <CpqQuoteDetail quoteId={id} />
    </>
  );
}
