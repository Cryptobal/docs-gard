/**
 * API Route: /api/crm/deals/[id]/contacts
 * GET    - Listar contactos vinculados al deal
 * POST   - Vincular contacto al deal
 * DELETE - Desvincular contacto del deal
 * PATCH  - Cambiar rol (marcar como primary)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id: dealId } = await params;

    const deal = await prisma.crmDeal.findFirst({
      where: { id: dealId, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const links = await prisma.crmDealContact.findMany({
      where: { dealId, tenantId: ctx.tenantId },
      select: {
        id: true,
        dealId: true,
        contactId: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    const contactIds = links.map((item) => item.contactId);
    const contacts = contactIds.length
      ? await prisma.crmContact.findMany({
          where: { tenantId: ctx.tenantId, id: { in: contactIds } },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            roleTitle: true,
            isPrimary: true,
          },
        })
      : [];
    const contactMap = new Map(contacts.map((contact) => [contact.id, contact]));
    const dealContacts = links
      .map((link) => {
        const contact = contactMap.get(link.contactId);
        if (!contact) return null;
        return { ...link, contact };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return NextResponse.json({ success: true, data: dealContacts });
  } catch (error) {
    console.error("Error fetching deal contacts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch deal contacts" },
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

    const { id: dealId } = await params;
    const body = await request.json();
    const { contactId, role = "participant" } = body;

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: "contactId es requerido" },
        { status: 400 }
      );
    }

    const deal = await prisma.crmDeal.findFirst({
      where: { id: dealId, tenantId: ctx.tenantId },
      select: { id: true, accountId: true },
    });
    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }
    const contact = await prisma.crmContact.findFirst({
      where: { id: contactId, tenantId: ctx.tenantId },
      select: { id: true, accountId: true },
    });
    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contacto inválido para este tenant" },
        { status: 400 }
      );
    }
    if (contact.accountId !== deal.accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "El contacto no pertenece a la cuenta del negocio",
        },
        { status: 400 }
      );
    }

    // If marking as primary, demote the current primary
    if (role === "primary") {
      await prisma.crmDealContact.updateMany({
        where: { dealId, tenantId: ctx.tenantId, role: "primary" },
        data: { role: "participant" },
      });

      // Also update the deal's primaryContactId
      await prisma.crmDeal.updateMany({
        where: { id: dealId, tenantId: ctx.tenantId },
        data: { primaryContactId: contact.id },
      });
    }

    const dealContact = await prisma.crmDealContact.create({
      data: {
        tenantId: ctx.tenantId,
        dealId,
        contactId: contact.id,
        role,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            roleTitle: true,
            isPrimary: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: dealContact }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Este contacto ya está vinculado al negocio" },
        { status: 409 }
      );
    }
    console.error("Error adding deal contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add deal contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id: dealId } = await params;
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: "contactId es requerido" },
        { status: 400 }
      );
    }

    const deal = await prisma.crmDeal.findFirst({
      where: { id: dealId, tenantId: ctx.tenantId },
      select: { id: true, primaryContactId: true },
    });
    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    await prisma.crmDealContact.deleteMany({
      where: { dealId, contactId, tenantId: ctx.tenantId },
    });
    if (deal.primaryContactId === contactId) {
      await prisma.crmDeal.updateMany({
        where: { id: dealId, tenantId: ctx.tenantId },
        data: { primaryContactId: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing deal contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove deal contact" },
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

    const { id: dealId } = await params;
    const body = await request.json();
    const { contactId, role } = body;

    if (!contactId || !role) {
      return NextResponse.json(
        { success: false, error: "contactId y role son requeridos" },
        { status: 400 }
      );
    }

    const deal = await prisma.crmDeal.findFirst({
      where: { id: dealId, tenantId: ctx.tenantId },
      select: { id: true, accountId: true },
    });
    if (!deal) {
      return NextResponse.json(
        { success: false, error: "Negocio no encontrado" },
        { status: 404 }
      );
    }
    const contact = await prisma.crmContact.findFirst({
      where: { id: contactId, tenantId: ctx.tenantId },
      select: { id: true, accountId: true },
    });
    if (!contact) {
      return NextResponse.json(
        { success: false, error: "Contacto inválido para este tenant" },
        { status: 400 }
      );
    }
    if (contact.accountId !== deal.accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "El contacto no pertenece a la cuenta del negocio",
        },
        { status: 400 }
      );
    }

    // If setting as primary, demote others
    if (role === "primary") {
      await prisma.crmDealContact.updateMany({
        where: { dealId, tenantId: ctx.tenantId, role: "primary" },
        data: { role: "participant" },
      });

      await prisma.crmDeal.updateMany({
        where: { id: dealId, tenantId: ctx.tenantId },
        data: { primaryContactId: contact.id },
      });
    }

    const existing = await prisma.crmDealContact.findFirst({
      where: { dealId, contactId, tenantId: ctx.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Contacto no vinculado a este negocio" },
        { status: 404 }
      );
    }

    const updated = await prisma.crmDealContact.update({
      where: { id: existing.id },
      data: { role },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            roleTitle: true,
            isPrimary: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating deal contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update deal contact" },
      { status: 500 }
    );
  }
}
