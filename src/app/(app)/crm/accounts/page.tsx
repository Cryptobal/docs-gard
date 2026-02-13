/**
 * CRM Accounts Page
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolvePagePerms, canView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/opai";
import { CrmAccountsClient, CrmSubnav } from "@/components/crm";

export default async function CrmAccountsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/crm/accounts");
  }
  const perms = await resolvePagePerms(session.user);
  if (!canView(perms, "crm", "accounts")) redirect("/crm");
  const role = session.user.role;

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());
  const accounts = await prisma.crmAccount.findMany({
    where: { tenantId },
    include: { _count: { select: { contacts: true, deals: true } } },
    orderBy: { createdAt: "desc" },
  });

  const initialAccounts = JSON.parse(JSON.stringify(accounts));

  return (
    <>
      <PageHeader
        title="Cuentas"
        description="Prospectos y clientes"
      />
      <CrmSubnav role={role} />
      <CrmAccountsClient initialAccounts={initialAccounts} />
    </>
  );
}
