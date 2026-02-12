/**
 * API Route: /api/crm/deals/[id]
 * GET   - Obtener negocio
 * PATCH - Actualizar negocio
 * DELETE - Eliminar negocio
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, parseBody } from "@/lib/api-auth";
import { createDealSchema } from "@/lib/validations/crm";

type SafeDealPayload = {
  id: string;
  tenantId: string;
  accountId: string;
  primaryContactId: string | null;
  title: string;
  amount: unknown;
  stageId: string;
  probability: number;
  expectedCloseDate: Date | null;
  status: string;
  lostReason: string | null;
  proposalLink: string | null;
  proposalSentAt: Date | null;
  dealType: string | null;
  notes: string | null;
  driveFolderLink: string | null;
  installationName: string | null;
  technicalVisitDate: Date | null;
  service: string | null;
  street: string | null;
  address: string | null;
  city: string | null;
  commune: string | null;
  lat: number | null;
  lng: number | null;
  installationWebsite: string | null;
  createdAt: Date;
  updatedAt: Date;
  stage: {
    id: string;
    tenantId: string;
    name: string;
    order: number;
    color: string | null;
    isActive: boolean;
    isClosedWon: boolean;
    isClosedLost: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  account: {
    id: string;
    name: string;
    type: string;
    status: string;
  } | null;
  primaryContact: {
    id: string;
    accountId: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    roleTitle: string | null;
    isPrimary: boolean;
  } | null;
};

async function buildTenantSafeDeal(
  dealId: string,
  tenantId: string
): Promise<SafeDealPayload | null> {
  const deal = await prisma.crmDeal.findFirst({
    where: { id: dealId, tenantId },
    include: { stage: true },
  });
  if (!deal) return null;

  let resolvedStage = deal.stage;
  if (deal.stage.tenantId !== tenantId) {
    const fallbackStage = await prisma.crmPipelineStage.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { order: "asc" },
    });
    if (fallbackStage) {
      await prisma.crmDeal.update({
        where: { id: deal.id },
        data: { stageId: fallbackStage.id },
      });
      resolvedStage = fallbackStage;
    }
  }

  let resolvedAccountId = deal.accountId;
  let resolvedPrimaryContactId = deal.primaryContactId;

  let account = await prisma.crmAccount.findFirst({
    where: { id: resolvedAccountId, tenantId },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
    },
  });

  if (!account) {
    const foreignAccount = await prisma.crmAccount.findUnique({
      where: { id: deal.accountId },
      select: { name: true, type: true, status: true, isActive: true },
    });
    if (foreignAccount?.name) {
      const matches = await prisma.crmAccount.findMany({
        where: {
          tenantId,
          name: { equals: foreignAccount.name, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
        },
        orderBy: { createdAt: "asc" },
        take: 2,
      });
      if (matches.length >= 1) {
        account = matches[0];
        resolvedAccountId = matches[0].id;
      } else {
        account = await prisma.crmAccount.create({
          data: {
            tenantId,
            name: foreignAccount.name,
            type: foreignAccount.type || "prospect",
            status: foreignAccount.status || "active",
            isActive: foreignAccount.isActive ?? true,
          },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        });
        resolvedAccountId = account.id;
      }
    } else {
      const fallbackName = deal.title?.trim()
        ? `${deal.title.trim().slice(0, 90)} (recuperada)`
        : `Cuenta recuperada ${deal.id.slice(0, 8)}`;
      account = await prisma.crmAccount.create({
        data: {
          tenantId,
          name: fallbackName,
          type: "prospect",
          status: "active",
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
        },
      });
      resolvedAccountId = account.id;
    }
  }

  let primaryContact = resolvedPrimaryContactId
    ? await prisma.crmContact.findFirst({
        where: { id: resolvedPrimaryContactId, tenantId },
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
    : null;

  if (!primaryContact && resolvedPrimaryContactId) {
    const foreignContact = await prisma.crmContact.findUnique({
      where: { id: resolvedPrimaryContactId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        roleTitle: true,
      },
    });
    if (foreignContact && account) {
      if (foreignContact.email) {
        const matches = await prisma.crmContact.findMany({
          where: {
            tenantId,
            email: { equals: foreignContact.email, mode: "insensitive" },
            accountId: account.id,
          },
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
          orderBy: { createdAt: "asc" },
          take: 2,
        });
        if (matches.length >= 1) {
          primaryContact = matches[0];
          resolvedPrimaryContactId = matches[0].id;
        }
      }
      if (!primaryContact) {
        const created = await prisma.crmContact.create({
          data: {
            tenantId,
            accountId: account.id,
            firstName: foreignContact.firstName || "Contacto",
            lastName: foreignContact.lastName || "Recuperado",
            email: foreignContact.email || null,
            phone: foreignContact.phone || null,
            roleTitle: foreignContact.roleTitle || null,
            isPrimary: true,
          },
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
        });
        primaryContact = created;
        resolvedPrimaryContactId = created.id;
      }
    }
  }

  if (primaryContact && account && primaryContact.accountId !== account.id) {
    if (primaryContact.email) {
      const sameAccount = await prisma.crmContact.findMany({
        where: {
          tenantId,
          accountId: account.id,
          email: { equals: primaryContact.email, mode: "insensitive" },
        },
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
        take: 2,
      });
      if (sameAccount.length === 1) {
        primaryContact = sameAccount[0];
        resolvedPrimaryContactId = sameAccount[0].id;
      } else {
        primaryContact = null;
        resolvedPrimaryContactId = null;
      }
    } else {
      primaryContact = null;
      resolvedPrimaryContactId = null;
    }
  }

  if (!primaryContact && account) {
    const accountPrimary = await prisma.crmContact.findFirst({
      where: { tenantId, accountId: account.id, isPrimary: true },
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
      orderBy: { createdAt: "asc" },
    });
    if (accountPrimary) {
      primaryContact = accountPrimary;
      resolvedPrimaryContactId = accountPrimary.id;
    }
  }

  const patch: { accountId?: string; primaryContactId?: string | null } = {};
  if (account && resolvedAccountId !== deal.accountId) {
    patch.accountId = resolvedAccountId;
  }
  if (resolvedPrimaryContactId !== deal.primaryContactId) {
    patch.primaryContactId = resolvedPrimaryContactId;
  }

  if (Object.keys(patch).length > 0) {
    await prisma.crmDeal.update({
      where: { id: deal.id },
      data: patch,
    });
  }

  return {
    ...deal,
    stage: resolvedStage,
    accountId: patch.accountId ?? deal.accountId,
    primaryContactId:
      patch.primaryContactId !== undefined
        ? patch.primaryContactId
        : deal.primaryContactId,
    account,
    primaryContact,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id } = await params;
    const deal = await buildTenantSafeDeal(id, ctx.tenantId);

    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deal });
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deal" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id } = await params;

    const existing = await prisma.crmDeal.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const parsed = await parseBody(request, createDealSchema.partial());
    if (parsed.error) return parsed.error;

    const raw = parsed.data as Record<string, unknown>;
    const data = { ...raw };
    if (data.accountId !== undefined) {
      const account = await prisma.crmAccount.findFirst({
        where: { id: String(data.accountId), tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!account) {
        return NextResponse.json(
          { success: false, error: "Cuenta inválida para este tenant" },
          { status: 400 }
        );
      }
    }
    if (data.primaryContactId !== undefined && data.primaryContactId !== null) {
      const contact = await prisma.crmContact.findFirst({
        where: { id: String(data.primaryContactId), tenantId: ctx.tenantId },
        select: { id: true, accountId: true },
      });
      if (!contact) {
        return NextResponse.json(
          { success: false, error: "Contacto inválido para este tenant" },
          { status: 400 }
        );
      }
      const targetAccountId =
        data.accountId !== undefined ? String(data.accountId) : existing.accountId;
      if (contact.accountId !== targetAccountId) {
        return NextResponse.json(
          {
            success: false,
            error: "El contacto no pertenece a la cuenta del negocio",
          },
          { status: 400 }
        );
      }
    }
    if (data.expectedCloseDate)
      data.expectedCloseDate = new Date(data.expectedCloseDate as string);

    await prisma.crmDeal.update({
      where: { id },
      data,
    });
    const deal = await buildTenantSafeDeal(id, ctx.tenantId);
    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deal });
  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id } = await params;

    const existing = await prisma.crmDeal.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // Cascade: stageHistory, dealQuotes, tasks se eliminan por onDelete: Cascade
    await prisma.crmDeal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}
