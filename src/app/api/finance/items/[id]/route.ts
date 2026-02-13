import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  unauthorized,
  resolveApiPerms,
  parseBody,
} from "@/lib/api-auth";
import { hasCapability } from "@/lib/permissions";
import { z } from "zod";

type Params = { id: string };

const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().max(50).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  active: z.boolean().optional(),
  maxPerDay: z.number().int().positive().optional().nullable(),
  maxPerMonth: z.number().int().positive().optional().nullable(),
  accountCode: z.string().max(50).optional().nullable(),
});

// ── PATCH: update item ──

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!hasCapability(perms, "rendicion_configure")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para editar ítems" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const parsed = await parseBody(request, updateItemSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const existing = await prisma.financeRendicionItem.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Ítem no encontrado" },
        { status: 404 },
      );
    }

    // Check duplicate name if changing
    if (body.name && body.name !== existing.name) {
      const duplicate = await prisma.financeRendicionItem.findFirst({
        where: { tenantId: ctx.tenantId, name: body.name, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Ya existe un ítem con ese nombre" },
          { status: 400 },
        );
      }
    }

    const item = await prisma.financeRendicionItem.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("[Finance] Error updating item:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el ítem" },
      { status: 500 },
    );
  }
}

// ── DELETE: delete item ──

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!hasCapability(perms, "rendicion_configure")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para eliminar ítems" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existing = await prisma.financeRendicionItem.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Ítem no encontrado" },
        { status: 404 },
      );
    }

    await prisma.financeRendicionItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Finance] Error deleting item:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar el ítem" },
      { status: 500 },
    );
  }
}
