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

const updateCostCenterSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().max(50).optional().nullable(),
  active: z.boolean().optional(),
  installationId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid().optional().nullable(),
});

// ── PATCH: update cost center ──

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
        { success: false, error: "Sin permisos para editar centros de costo" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const parsed = await parseBody(request, updateCostCenterSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const existing = await prisma.financeCostCenter.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Centro de costo no encontrado" },
        { status: 404 },
      );
    }

    // Check duplicate code if changing
    if (body.code && body.code !== existing.code) {
      const duplicate = await prisma.financeCostCenter.findFirst({
        where: { tenantId: ctx.tenantId, code: body.code, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "Ya existe un centro de costo con ese código" },
          { status: 400 },
        );
      }
    }

    const costCenter = await prisma.financeCostCenter.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: costCenter });
  } catch (error) {
    console.error("[Finance] Error updating cost center:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el centro de costo" },
      { status: 500 },
    );
  }
}

// ── DELETE: delete cost center ──

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
        { success: false, error: "Sin permisos para eliminar centros de costo" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const existing = await prisma.financeCostCenter.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Centro de costo no encontrado" },
        { status: 404 },
      );
    }

    await prisma.financeCostCenter.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Finance] Error deleting cost center:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar el centro de costo" },
      { status: 500 },
    );
  }
}
