/**
 * CRM Deals Page
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCrmSubmoduleAccess } from "@/lib/module-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/opai";
import { CrmDealsClient, CrmSubnav } from "@/components/crm";

type DealsFocus =
  | "all"
  | "proposals-sent-30d"
  | "won-after-proposal-30d"
  | "followup-open"
  | "followup-overdue";

function normalizeDealsFocus(value?: string): DealsFocus {
  if (value === "proposals-sent-30d") return value;
  if (value === "won-after-proposal-30d") return value;
  if (value === "followup-open") return value;
  if (value === "followup-overdue") return value;
  return "all";
}

function getDealsFocusText(focus: DealsFocus): string | null {
  if (focus === "proposals-sent-30d") return "Filtro activo: propuestas enviadas (últimos 30 días)";
  if (focus === "won-after-proposal-30d") return "Filtro activo: negocios ganados tras propuesta (últimos 30 días)";
  if (focus === "followup-open") return "Filtro activo: negocios abiertos en seguimiento";
  if (focus === "followup-overdue") return "Filtro activo: negocios con seguimientos vencidos";
  return null;
}

export default async function CrmDealsPage({
  searchParams,
}: {
  searchParams?: Promise<{ focus?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const focus = normalizeDealsFocus(resolvedSearchParams?.focus);

  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/crm/deals");
  }
  const role = session.user.role;

  if (!hasCrmSubmoduleAccess(role, "deals")) {
    redirect("/crm");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const includeRelations = {
    stage: true,
    quotes: true,
    followUpLogs: {
      where: { status: "pending" },
      orderBy: { scheduledAt: "asc" },
      take: 1,
      select: {
        id: true,
        sequence: true,
        status: true,
        scheduledAt: true,
      },
    },
  } as const;

  let deals;
  if (focus === "proposals-sent-30d") {
    deals = await prisma.crmDeal.findMany({
      where: {
        tenantId,
        proposalSentAt: { gte: thirtyDaysAgo },
      },
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });
  } else if (focus === "followup-open") {
    deals = await prisma.crmDeal.findMany({
      where: {
        tenantId,
        status: "open",
        proposalSentAt: { not: null },
      },
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });
  } else if (focus === "followup-overdue") {
    deals = await prisma.crmDeal.findMany({
      where: {
        tenantId,
        status: "open",
        followUpLogs: {
          some: {
            status: "pending",
            scheduledAt: { lte: now },
          },
        },
      },
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });
  } else if (focus === "won-after-proposal-30d") {
    const wonStageIds = await prisma.crmPipelineStage.findMany({
      where: { tenantId, isClosedWon: true },
      select: { id: true },
    });

    deals = await prisma.crmDeal.findMany({
      where: {
        tenantId,
        status: "won",
        proposalSentAt: { not: null },
        stageHistory: {
          some: {
            toStageId: { in: wonStageIds.map((stage: { id: string }) => stage.id) },
            changedAt: { gte: thirtyDaysAgo },
          },
        },
      },
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });
  } else {
    deals = await prisma.crmDeal.findMany({
      where: { tenantId },
      include: includeRelations,
      orderBy: { createdAt: "desc" },
    });
  }

  const accountIds = Array.from(new Set(deals.map((deal) => deal.accountId)));
  const primaryContactIds = Array.from(
    new Set(
      deals
        .map((deal) => deal.primaryContactId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const stageIds = Array.from(new Set(deals.map((deal) => deal.stageId)));
  const [safeAccounts, safeContacts, safeStages] = await Promise.all([
    accountIds.length
      ? prisma.crmAccount.findMany({
          where: { tenantId, id: { in: accountIds } },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        })
      : Promise.resolve([]),
    primaryContactIds.length
      ? prisma.crmContact.findMany({
          where: { tenantId, id: { in: primaryContactIds } },
          select: {
            id: true,
            accountId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            roleTitle: true,
            isPrimary: true,
          },
        })
      : Promise.resolve([]),
    stageIds.length
      ? prisma.crmPipelineStage.findMany({
          where: { tenantId, id: { in: stageIds } },
        })
      : Promise.resolve([]),
  ]);
  const accountMap = new Map(safeAccounts.map((account) => [account.id, account]));
  const contactMap = new Map(safeContacts.map((contact) => [contact.id, contact]));
  const stageMap = new Map(safeStages.map((stage) => [stage.id, stage]));
  const sanitizedDeals = deals.map((deal) => {
    const account = accountMap.get(deal.accountId) ?? null;
    const primaryContact = deal.primaryContactId
      ? contactMap.get(deal.primaryContactId) ?? null
      : null;
    return {
      ...deal,
      stage: stageMap.get(deal.stageId) ?? deal.stage,
      account,
      primaryContact:
        primaryContact && account && primaryContact.accountId === account.id
          ? primaryContact
          : null,
    };
  });

  const [accounts, stages, quotes] = await Promise.all([
    prisma.crmAccount.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.crmPipelineStage.findMany({
      where: { tenantId, isActive: true },
      orderBy: { order: "asc" },
    }),
    prisma.cpqQuote.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: { id: true, code: true, clientName: true, status: true },
    }),
  ]);

  const initialDeals = JSON.parse(JSON.stringify(sanitizedDeals));
  const initialAccounts = JSON.parse(JSON.stringify(accounts));
  const initialStages = JSON.parse(JSON.stringify(stages));
  const initialQuotes = JSON.parse(JSON.stringify(quotes));

  return (
    <>
      <PageHeader
        title="Negocios"
        description={getDealsFocusText(focus) ?? "Pipeline comercial y oportunidades"}
      />
      <CrmSubnav role={role} />
      <CrmDealsClient
        initialDeals={initialDeals}
        accounts={initialAccounts}
        stages={initialStages}
        quotes={initialQuotes}
        initialFocus={focus}
      />
    </>
  );
}
