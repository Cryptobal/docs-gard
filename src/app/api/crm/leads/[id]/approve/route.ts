/**
 * API Route: /api/crm/leads/[id]/approve
 * POST - Aprobar prospecto y convertir a cliente + contacto + negocio
 * Incluye deteccion de duplicados por nombre de empresa
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const lead = await prisma.crmLead.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    if (lead.status === "approved") {
      return NextResponse.json(
        { success: false, error: "Lead ya aprobado" },
        { status: 400 }
      );
    }

    const accountName =
      body?.accountName?.trim() ||
      lead.companyName?.trim() ||
      [lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
      "Cliente sin nombre";

    // Duplicate detection: check if account with same name already exists
    const duplicates = await prisma.crmAccount.findMany({
      where: {
        tenantId: ctx.tenantId,
        name: { equals: accountName, mode: "insensitive" },
      },
      select: { id: true, name: true, rut: true, type: true },
      take: 5,
    });

    // If checkDuplicates flag is set, return duplicates without creating
    if (body?.checkDuplicates && duplicates.length > 0) {
      return NextResponse.json({
        success: true,
        duplicates,
        message: `Se encontraron ${duplicates.length} cuenta(s) con nombre similar`,
      });
    }

    const contactFirstName =
      body?.contactFirstName?.trim() ||
      lead.firstName?.trim() ||
      "Contacto";

    const contactLastName =
      body?.contactLastName?.trim() ||
      lead.lastName?.trim() ||
      "";

    const pipelineStage = await prisma.crmPipelineStage.findFirst({
      where: { tenantId: ctx.tenantId, isActive: true },
      orderBy: { order: "asc" },
    });

    if (!pipelineStage) {
      return NextResponse.json(
        { success: false, error: "No hay etapas de pipeline configuradas" },
        { status: 400 }
      );
    }

    const dealTitle =
      body?.dealTitle?.trim() || `Oportunidad ${accountName}`;

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.crmAccount.create({
        data: {
          tenantId: ctx.tenantId,
          name: accountName,
          type: "prospect",
          rut: body?.rut?.trim() || null,
          industry: body?.industry?.trim() || null,
          size: body?.size?.trim() || null,
          segment: body?.segment?.trim() || null,
          website: body?.website?.trim() || null,
          address: body?.address?.trim() || null,
          notes: body?.accountNotes?.trim() || lead.notes || null,
          ownerId: ctx.userId,
        },
      });

      const contact = await tx.crmContact.create({
        data: {
          tenantId: ctx.tenantId,
          accountId: account.id,
          firstName: contactFirstName,
          lastName: contactLastName,
          email: body?.email?.trim() || lead.email || null,
          phone: body?.phone?.trim() || lead.phone || null,
          roleTitle: body?.roleTitle?.trim() || null,
          isPrimary: true,
        },
      });

      const deal = await tx.crmDeal.create({
        data: {
          tenantId: ctx.tenantId,
          accountId: account.id,
          primaryContactId: contact.id,
          title: dealTitle,
          amount: body?.amount ? Number(body.amount) : 0,
          stageId: pipelineStage.id,
          probability: body?.probability ? Number(body.probability) : 0,
          expectedCloseDate: body?.expectedCloseDate
            ? new Date(body.expectedCloseDate)
            : null,
          status: "open",
        },
      });

      await tx.crmDealStageHistory.create({
        data: {
          tenantId: ctx.tenantId,
          dealId: deal.id,
          fromStageId: null,
          toStageId: pipelineStage.id,
          changedBy: ctx.userId,
        },
      });

      await tx.crmLead.update({
        where: { id: lead.id },
        data: {
          status: "approved",
          approvedAt: new Date(),
          approvedBy: ctx.userId,
          convertedAccountId: account.id,
          convertedContactId: contact.id,
          convertedDealId: deal.id,
        },
      });

      // Vincular instalación tentativa del lead a la cuenta aprobada
      await tx.crmInstallation.updateMany({
        where: { leadId: lead.id },
        data: {
          accountId: account.id,
          leadId: null,
        },
      });

      // Crear instalaciones desde el array (con dotación)
      const installationsPayload = Array.isArray(body?.installations) ? body.installations : [];
      for (const inst of installationsPayload) {
        const instName = inst?.name?.trim();
        if (!instName) continue;
        await tx.crmInstallation.create({
          data: {
            tenantId: ctx.tenantId,
            accountId: account.id,
            name: instName,
            address: inst?.address?.trim() || null,
            city: inst?.city?.trim() || null,
            commune: inst?.commune?.trim() || null,
            lat: inst?.lat ? Number(inst.lat) : null,
            lng: inst?.lng ? Number(inst.lng) : null,
            metadata: Array.isArray(inst?.dotacion) && inst.dotacion.length > 0
              ? { dotacion: inst.dotacion }
              : undefined,
          },
        });
      }

      // Fallback: si no hay installations array pero sí installationName (legacy)
      if (installationsPayload.length === 0 && body?.installationName?.trim()) {
        await tx.crmInstallation.create({
          data: {
            tenantId: ctx.tenantId,
            accountId: account.id,
            name: body.installationName.trim(),
            address: body?.installationAddress?.trim() || null,
            city: body?.installationCity?.trim() || null,
            commune: body?.installationCommune?.trim() || null,
          },
        });
      }

      // Crear DealContact para el contacto principal
      await tx.crmDealContact.create({
        data: {
          tenantId: ctx.tenantId,
          dealId: deal.id,
          contactId: contact.id,
          role: "primary",
        },
      });

      await tx.crmHistoryLog.create({
        data: {
          tenantId: ctx.tenantId,
          entityType: "lead",
          entityId: lead.id,
          action: "lead_approved",
          details: {
            accountId: account.id,
            contactId: contact.id,
            dealId: deal.id,
          },
          createdBy: ctx.userId,
        },
      });

      return { account, contact, deal };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error approving CRM lead:", error);
    return NextResponse.json(
      { success: false, error: "Failed to approve lead" },
      { status: 500 }
    );
  }
}
