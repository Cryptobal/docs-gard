/**
 * API Route: /api/crm/deals/[id]/quotes
 * GET  - Listar cotizaciones vinculadas
 * POST - Vincular cotización CPQ
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, parseBody } from "@/lib/api-auth";
import { linkDealQuoteSchema } from "@/lib/validations/crm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id } = await params;

    const links = await prisma.crmDealQuote.findMany({
      where: { tenantId: ctx.tenantId, dealId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: links });
  } catch (error) {
    console.error("Error fetching CRM deal quotes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deal quotes" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id } = await params;
    const parsed = await parseBody(request, linkDealQuoteSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const [deal, quote] = await Promise.all([
      prisma.crmDeal.findFirst({
        where: { id, tenantId: ctx.tenantId },
        select: {
          id: true,
          accountId: true,
          primaryContactId: true,
          account: { select: { name: true } },
        },
      }),
      prisma.cpqQuote.findFirst({
        where: { id: body.quoteId, tenantId: ctx.tenantId },
        select: {
          id: true,
          contactId: true,
          clientName: true,
        },
      }),
    ]);

    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    if (!quote) {
      return NextResponse.json(
        { success: false, error: "Cotización no encontrada" },
        { status: 404 }
      );
    }

    const quotePatch: {
      dealId: string;
      accountId: string;
      contactId?: string;
      clientName?: string;
    } = {
      dealId: deal.id,
      accountId: deal.accountId,
    };
    if (!quote.contactId && deal.primaryContactId) {
      quotePatch.contactId = deal.primaryContactId;
    }
    if (!quote.clientName && deal.account?.name) {
      quotePatch.clientName = deal.account.name;
    }

    const link = await prisma.$transaction(async (tx) => {
      const createdLink = await tx.crmDealQuote.create({
        data: {
          tenantId: ctx.tenantId,
          dealId: id,
          quoteId: body.quoteId,
        },
      });

      await tx.cpqQuote.update({
        where: { id: quote.id },
        data: quotePatch,
      });

      await tx.crmHistoryLog.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: "deal",
          entityId: id,
          action: "deal_quote_linked",
          details: { quoteId: body.quoteId },
          createdBy: ctx.userId,
        },
      });

      return createdLink;
    });

    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Cotización ya vinculada" },
        { status: 409 }
      );
    }
    console.error("Error linking CRM deal quote:", error);
    return NextResponse.json(
      { success: false, error: "Failed to link deal quote" },
      { status: 500 }
    );
  }
}
