/**
 * CRM Contact Detail Page
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader, Breadcrumb } from "@/components/opai";
import { CrmContactDetailClient } from "@/components/crm/CrmContactDetailClient";
import { CrmSubnav } from "@/components/crm/CrmSubnav";

export default async function CrmContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/opai/login?callbackUrl=/crm/contacts/${id}`);
  }

  if (!hasAppAccess(session.user.role, "crm")) {
    redirect("/hub");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());

  const contact = await prisma.crmContact.findFirst({
    where: { id, tenantId },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          type: true,
          industry: true,
        },
      },
    },
  });

  if (!contact) {
    redirect("/crm/contacts");
  }

  // Get deals from the contact's account
  const deals = contact.accountId
    ? await prisma.crmDeal.findMany({
        where: { tenantId, accountId: contact.accountId },
        include: { stage: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const data = JSON.parse(JSON.stringify(contact));
  const initialDeals = JSON.parse(JSON.stringify(deals));

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

  return (
    <>
      <Breadcrumb
        items={[
          { label: "CRM", href: "/crm" },
          { label: "Contactos", href: "/crm/contacts" },
          { label: fullName },
        ]}
        className="mb-4"
      />
      <PageHeader
        title={fullName}
        description={`${contact.account?.name || "Sin cuenta"} · ${contact.roleTitle || "Sin cargo"}`}
      />
      <CrmSubnav />
      <CrmContactDetailClient contact={data} deals={initialDeals} />
    </>
  );
}
