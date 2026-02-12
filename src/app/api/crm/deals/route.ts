/**
 * API Route: /api/crm/deals
 * GET  - Listar negocios
 * POST - Crear negocio
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, parseBody } from "@/lib/api-auth";
import { createDealSchema } from "@/lib/validations/crm";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const accountId = request.nextUrl.searchParams.get("accountId") || undefined;

    const deals = await prisma.crmDeal.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(accountId ? { accountId } : {}),
      },
      include: { stage: true },
      orderBy: { createdAt: "desc" },
    });

    const accountIds = Array.from(new Set(deals.map((deal) => deal.accountId)));
    const primaryContactIds = Array.from(
      new Set(
        deals
          .map((deal) => deal.primaryContactId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const stageIds = Array.from(new Set(deals.map((deal) => deal.stageId)));
    const [accounts, contacts, stages] = await Promise.all([
      accountIds.length
        ? prisma.crmAccount.findMany({
            where: { tenantId: ctx.tenantId, id: { in: accountIds } },
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
            where: { tenantId: ctx.tenantId, id: { in: primaryContactIds } },
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
            where: { tenantId: ctx.tenantId, id: { in: stageIds } },
          })
        : Promise.resolve([]),
    ]);

    const accountMap = new Map(accounts.map((account) => [account.id, account]));
    const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
    const stageMap = new Map(stages.map((stage) => [stage.id, stage]));

    const sanitizedDeals = deals.map((deal) => {
      const safeAccount = accountMap.get(deal.accountId) ?? null;
      const safePrimaryContact = deal.primaryContactId
        ? contactMap.get(deal.primaryContactId) ?? null
        : null;
      const safeStage = stageMap.get(deal.stageId) ?? deal.stage;
      const primaryContactBelongsToAccount =
        safePrimaryContact && safeAccount
          ? safePrimaryContact.accountId === safeAccount.id
          : true;

      return {
        ...deal,
        stage: safeStage,
        account: safeAccount,
        primaryContact:
          primaryContactBelongsToAccount && safePrimaryContact
            ? safePrimaryContact
            : null,
      };
    });

    return NextResponse.json({ success: true, data: sanitizedDeals });
  } catch (error) {
    console.error("Error fetching CRM deals:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const parsed = await parseBody(request, createDealSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const stage =
      body.stageId ||
      (await prisma.crmPipelineStage.findFirst({
        where: { tenantId: ctx.tenantId, isActive: true },
        orderBy: { order: "asc" },
        select: { id: true },
      }))?.id;

    if (!stage) {
      return NextResponse.json(
        { success: false, error: "No hay etapas de pipeline configuradas" },
        { status: 400 }
      );
    }

    const account = await prisma.crmAccount.findFirst({
      where: { id: body.accountId, tenantId: ctx.tenantId },
      select: { id: true, name: true, type: true, status: true },
    });
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Cuenta inválida para este tenant" },
        { status: 400 }
      );
    }

    if (body.primaryContactId) {
      const contact = await prisma.crmContact.findFirst({
        where: { id: body.primaryContactId, tenantId: ctx.tenantId },
        select: { id: true, accountId: true },
      });
      if (!contact || contact.accountId !== account.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Contacto inválido o no pertenece a la cuenta seleccionada",
          },
          { status: 400 }
        );
      }
    }

    const deal = await prisma.crmDeal.create({
      data: {
        tenantId: ctx.tenantId,
        accountId: body.accountId,
        primaryContactId: body.primaryContactId || null,
        title: body.title || "Negocio sin título",
        amount: body.amount,
        stageId: stage,
        probability: body.probability,
        expectedCloseDate: body.expectedCloseDate
          ? new Date(body.expectedCloseDate)
          : null,
        status: "open",
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        stage: true,
        primaryContact: true,
      },
    });

    await prisma.crmDealStageHistory.create({
      data: {
        tenantId: ctx.tenantId,
        dealId: deal.id,
        fromStageId: null,
        toStageId: stage,
        changedBy: ctx.userId,
      },
    });

    return NextResponse.json({ success: true, data: deal }, { status: 201 });
  } catch (error) {
    console.error("Error creating CRM deal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create deal" },
      { status: 500 }
    );
  }
}
