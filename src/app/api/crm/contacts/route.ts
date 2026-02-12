/**
 * API Route: /api/crm/contacts
 * GET  - Listar contactos
 * POST - Crear contacto
 * PATCH - Editar contacto
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, parseBody } from "@/lib/api-auth";
import { createContactSchema, updateContactSchema } from "@/lib/validations/crm";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const accountId = request.nextUrl.searchParams.get("accountId") || undefined;

    const contacts = await prisma.crmContact.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(accountId ? { accountId } : {}),
      },
      include: { account: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: contacts });
  } catch (error) {
    console.error("Error fetching CRM contacts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const parsed = await parseBody(request, createContactSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const emailNormalized = body.email.trim().toLowerCase();
    const existing = await prisma.crmContact.findFirst({
      where: {
        tenantId: ctx.tenantId,
        email: { equals: emailNormalized, mode: "insensitive" },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Ya existe un contacto con este email. Use el mismo para evitar duplicados." },
        { status: 409 }
      );
    }

    const contact = await prisma.crmContact.create({
      data: {
        tenantId: ctx.tenantId,
        accountId: body.accountId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        roleTitle: body.roleTitle || null,
        isPrimary: body.isPrimary,
      },
      include: { account: true },
    });

    return NextResponse.json({ success: true, data: contact }, { status: 201 });
  } catch (error) {
    console.error("Error creating CRM contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create contact" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id, ...body } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID es requerido" },
        { status: 400 }
      );
    }

    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const existing = await prisma.crmContact.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Contacto no encontrado" },
        { status: 404 }
      );
    }

    const contact = await prisma.crmContact.update({
      where: { id },
      data: parsed.data,
      include: { account: true },
    });

    return NextResponse.json({ success: true, data: contact });
  } catch (error) {
    console.error("Error updating CRM contact:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update contact" },
      { status: 500 }
    );
  }
}
