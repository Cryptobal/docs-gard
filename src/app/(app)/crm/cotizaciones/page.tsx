/**
 * CRM - Cotizaciones (CPQ)
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { CpqDashboard } from "@/components/cpq/CpqDashboard";
import { CrmSubnav } from "@/components/crm/CrmSubnav";

export default async function CrmCotizacionesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/crm/cotizaciones");
  }

  if (!hasAppAccess(session.user.role, "crm")) {
    redirect("/hub");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());
  const quotes = await prisma.cpqQuote.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  const initialQuotes = JSON.parse(JSON.stringify(quotes));
  
  return (
    <>
      <CrmSubnav />
      <CpqDashboard initialQuotes={initialQuotes} />
    </>
  );
}
