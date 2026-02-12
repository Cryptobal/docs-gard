/**
 * API Route: /api/cpq/quotes/[id]
 * GET    - Detalle de cotización
 * PATCH  - Actualizar cotización
 * DELETE - Eliminar cotización
 */

import { NextRequest, NextResponse } from "next/server";
import { hasAppAccess } from "@/lib/app-access";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function forbiddenCpq() {
  return NextResponse.json(
    { success: false, error: "Sin permisos para módulo CPQ" },
    { status: 403 }
  );
}

async function reconcileQuoteCrmContext(
  tenantId: string,
  quote: Awaited<ReturnType<typeof prisma.cpqQuote.findFirst>>
) {
  if (!quote) return quote;
  const findAccountByName = async (name: string) => {
    const normalized = name.trim();
    if (!normalized) return null;
    const matches = await prisma.crmAccount.findMany({
      where: {
        tenantId,
        name: { equals: normalized, mode: "insensitive" },
      },
      select: { id: true, name: true },
      take: 2,
    });
    return matches.length >= 1 ? matches[0] : null;
  };
  const ensureAccountByName = async (name: string) => {
    const existing = await findAccountByName(name);
    if (existing) return existing;
    const normalized = name.trim();
    if (!normalized) return null;
    return prisma.crmAccount.create({
      data: {
        tenantId,
        name: normalized,
        type: "prospect",
        status: "active",
        isActive: true,
      },
      select: { id: true, name: true },
    });
  };

  const patch: {
    dealId?: string | null;
    accountId?: string | null;
    contactId?: string | null;
    installationId?: string | null;
    clientName?: string | null;
  } = {};

  const [accountRecord, contactRecord, installationRecord] = await Promise.all([
    quote.accountId
      ? prisma.crmAccount.findFirst({
          where: { id: quote.accountId, tenantId },
          select: { id: true },
        })
      : Promise.resolve(null),
    quote.contactId
      ? prisma.crmContact.findFirst({
          where: { id: quote.contactId, tenantId },
          select: { id: true, accountId: true },
        })
      : Promise.resolve(null),
    quote.installationId
      ? prisma.crmInstallation.findFirst({
          where: { id: quote.installationId, tenantId },
          select: { id: true, accountId: true },
        })
      : Promise.resolve(null),
  ]);

  // Sanitize invalid references first (common on legacy/broken records).
  if (quote.accountId && !accountRecord) {
    patch.accountId = null;
  }
  if (
    quote.contactId &&
    (!contactRecord ||
      (accountRecord && contactRecord.accountId !== quote.accountId))
  ) {
    patch.contactId = null;
  }
  if (
    quote.installationId &&
    (!installationRecord ||
      (accountRecord &&
        installationRecord.accountId &&
        installationRecord.accountId !== quote.accountId))
  ) {
    patch.installationId = null;
  }

  const effectiveAccountId =
    patch.accountId !== undefined ? patch.accountId : quote.accountId;
  const effectiveContactId =
    patch.contactId !== undefined ? patch.contactId : quote.contactId;
  let effectiveResolvedAccountId = effectiveAccountId;
  let effectiveResolvedContactId = effectiveContactId;

  let effectiveDealId = quote.dealId ?? null;
  let dealRecord =
    effectiveDealId
      ? await prisma.crmDeal.findFirst({
          where: { id: effectiveDealId, tenantId },
          select: {
            id: true,
            accountId: true,
            primaryContactId: true,
            account: { select: { name: true } },
          },
        })
      : null;

  // Existing dealId points outside tenant / stale relation.
  if (effectiveDealId && !dealRecord) {
    patch.dealId = null;
    effectiveDealId = null;
  }

  // Backfill from crm.deal_quotes link when cpq.quote.dealId is empty.
  if (!dealRecord) {
    const linkedDeal = await prisma.crmDealQuote.findFirst({
      where: { tenantId, quoteId: quote.id },
      orderBy: { createdAt: "desc" },
      select: { dealId: true },
    });
    if (linkedDeal?.dealId) {
      dealRecord = await prisma.crmDeal.findFirst({
        where: { id: linkedDeal.dealId, tenantId },
        select: {
          id: true,
          accountId: true,
          primaryContactId: true,
          account: { select: { name: true } },
        },
      });
      if (dealRecord) {
        effectiveDealId = linkedDeal.dealId;
        patch.dealId = linkedDeal.dealId;
      }
    }
  }

  // If there is a deal, infer missing account/contact/client fields.
  if (dealRecord) {
    const [dealAccountRecord, dealPrimaryContactRecord] = await Promise.all([
      prisma.crmAccount.findFirst({
        where: { id: dealRecord.accountId, tenantId },
        select: { id: true, name: true },
      }),
      dealRecord.primaryContactId
        ? prisma.crmContact.findFirst({
            where: { id: dealRecord.primaryContactId, tenantId },
            select: { id: true, accountId: true },
          })
        : Promise.resolve(null),
    ]);

    if (dealAccountRecord) {
      if (!effectiveResolvedAccountId || effectiveResolvedAccountId !== dealAccountRecord.id) {
        patch.accountId = dealAccountRecord.id;
        effectiveResolvedAccountId = dealAccountRecord.id;
      }
    } else if (!effectiveResolvedAccountId && quote.clientName) {
      const mappedByName = await ensureAccountByName(quote.clientName);
      if (mappedByName) {
        patch.accountId = mappedByName.id;
        effectiveResolvedAccountId = mappedByName.id;
      }
    }

    if (
      !effectiveResolvedContactId &&
      dealPrimaryContactRecord &&
      (!effectiveResolvedAccountId ||
        dealPrimaryContactRecord.accountId === effectiveResolvedAccountId)
    ) {
      patch.contactId = dealPrimaryContactRecord.id;
      effectiveResolvedContactId = dealPrimaryContactRecord.id;
    }

    if (!quote.clientName && dealAccountRecord?.name) {
      patch.clientName = dealAccountRecord.name;
    }
  }

  if (!effectiveResolvedAccountId && quote.clientName) {
    const mappedByName = await ensureAccountByName(quote.clientName);
    if (mappedByName) {
      patch.accountId = mappedByName.id;
      effectiveResolvedAccountId = mappedByName.id;
    }
  }

  if (
    effectiveResolvedAccountId &&
    effectiveResolvedContactId &&
    contactRecord &&
    contactRecord.accountId !== effectiveResolvedAccountId
  ) {
    patch.contactId = null;
    effectiveResolvedContactId = null;
  }

  if (
    effectiveResolvedAccountId &&
    quote.installationId &&
    patch.installationId === undefined &&
    installationRecord &&
    installationRecord.accountId &&
    installationRecord.accountId !== effectiveResolvedAccountId
  ) {
    patch.installationId = null;
  }

  if (
    effectiveResolvedAccountId &&
    !patch.clientName &&
    (!quote.clientName || quote.clientName.trim().length === 0)
  ) {
    const account = await prisma.crmAccount.findFirst({
      where: { id: effectiveResolvedAccountId, tenantId },
      select: { name: true },
    });
    if (account?.name) {
      patch.clientName = account.name;
    }
  }

  if (!Object.keys(patch).length) return quote;

  await prisma.cpqQuote.update({
    where: { id: quote.id },
    data: patch,
  });

  return { ...quote, ...patch };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    if (!hasAppAccess(ctx.userRole, "cpq")) return forbiddenCpq();
    const tenantId = ctx.tenantId;

    const quote = await prisma.cpqQuote.findFirst({
      where: { id, tenantId },
      include: {
        positions: {
          include: {
            puestoTrabajo: true,
            cargo: true,
            rol: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const reconciledQuote = await reconcileQuoteCrmContext(tenantId, quote);
    return NextResponse.json({ success: true, data: reconciledQuote });
  } catch (error) {
    console.error("Error fetching CPQ quote:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    if (!hasAppAccess(ctx.userRole, "cpq")) return forbiddenCpq();
    const tenantId = ctx.tenantId;
    const body = await request.json();
    const existing = await prisma.cpqQuote.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        accountId: true,
        contactId: true,
        dealId: true,
        installationId: true,
      },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    // Build update data - only include fields that are present in the body
    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.clientName !== undefined) updateData.clientName = body.clientName?.trim() || null;
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    // CRM context fields
    const crmTouched =
      body.accountId !== undefined ||
      body.contactId !== undefined ||
      body.dealId !== undefined ||
      body.installationId !== undefined;
    let requestedAccountId: string | null =
      body.accountId !== undefined ? body.accountId || null : existing.accountId;
    let requestedContactId: string | null =
      body.contactId !== undefined ? body.contactId || null : existing.contactId;
    let requestedDealId: string | null =
      body.dealId !== undefined ? body.dealId || null : existing.dealId;
    let requestedInstallationId: string | null =
      body.installationId !== undefined
        ? body.installationId || null
        : existing.installationId;

    if (crmTouched) {
      const [accountRecord, contactRecord, dealRecord, installationRecord] =
        await Promise.all([
          requestedAccountId
            ? prisma.crmAccount.findFirst({
                where: { id: requestedAccountId, tenantId },
                select: { id: true },
              })
            : Promise.resolve(null),
          requestedContactId
            ? prisma.crmContact.findFirst({
                where: { id: requestedContactId, tenantId },
                select: { id: true, accountId: true },
              })
            : Promise.resolve(null),
          requestedDealId
            ? prisma.crmDeal.findFirst({
                where: { id: requestedDealId, tenantId },
                select: { id: true, accountId: true, primaryContactId: true },
              })
            : Promise.resolve(null),
          requestedInstallationId
            ? prisma.crmInstallation.findFirst({
                where: { id: requestedInstallationId, tenantId },
                select: { id: true, accountId: true },
              })
            : Promise.resolve(null),
        ]);

      if (requestedAccountId && !accountRecord) {
        return NextResponse.json(
          { success: false, error: "Cuenta inválida para este tenant" },
          { status: 400 }
        );
      }
      if (requestedContactId && !contactRecord) {
        return NextResponse.json(
          { success: false, error: "Contacto inválido para este tenant" },
          { status: 400 }
        );
      }
      if (requestedDealId && !dealRecord) {
        return NextResponse.json(
          { success: false, error: "Negocio inválido para este tenant" },
          { status: 400 }
        );
      }
      if (requestedInstallationId && !installationRecord) {
        return NextResponse.json(
          { success: false, error: "Instalación inválida para este tenant" },
          { status: 400 }
        );
      }

      const accountCandidates = [
        requestedAccountId,
        contactRecord?.accountId ?? null,
        dealRecord?.accountId ?? null,
        installationRecord?.accountId ?? null,
      ].filter((candidate): candidate is string => Boolean(candidate));
      const distinctAccountCandidates = Array.from(new Set(accountCandidates));

      if (distinctAccountCandidates.length > 1) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Contexto CRM inconsistente: cuenta/contacto/negocio/instalación no coinciden",
          },
          { status: 400 }
        );
      }

      requestedAccountId =
        distinctAccountCandidates.length === 1
          ? distinctAccountCandidates[0]
          : null;

      if (
        requestedContactId &&
        contactRecord &&
        requestedAccountId &&
        contactRecord.accountId !== requestedAccountId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "El contacto seleccionado no pertenece a la cuenta vinculada",
          },
          { status: 400 }
        );
      }
      if (
        requestedInstallationId &&
        installationRecord &&
        requestedAccountId &&
        installationRecord.accountId &&
        installationRecord.accountId !== requestedAccountId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "La instalación seleccionada no pertenece a la cuenta vinculada",
          },
          { status: 400 }
        );
      }

      if (
        !requestedContactId &&
        requestedDealId &&
        dealRecord?.primaryContactId &&
        requestedAccountId === dealRecord.accountId
      ) {
        const primaryContact = await prisma.crmContact.findFirst({
          where: { id: dealRecord.primaryContactId, tenantId },
          select: { id: true, accountId: true },
        });
        if (
          primaryContact &&
          primaryContact.accountId === requestedAccountId
        ) {
          requestedContactId = primaryContact.id;
        }
      }

      updateData.accountId = requestedAccountId;
      updateData.contactId = requestedContactId;
      updateData.dealId = requestedDealId;
      updateData.installationId = requestedInstallationId;
    }
    if (body.currency !== undefined) updateData.currency = body.currency || "CLP";
    if (body.aiDescription !== undefined) updateData.aiDescription = body.aiDescription || null;

    await prisma.cpqQuote.updateMany({
      where: { id, tenantId },
      data: updateData,
    });

    const quote = await prisma.cpqQuote.findUnique({ where: { id } });
    return NextResponse.json({ success: true, data: quote });
  } catch (error) {
    console.error("Error updating CPQ quote:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update quote" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    if (!hasAppAccess(ctx.userRole, "cpq")) return forbiddenCpq();
    const tenantId = ctx.tenantId;

    const existing = await prisma.cpqQuote.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    await prisma.cpqQuote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting CPQ quote:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete quote" },
      { status: 500 }
    );
  }
}
