import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  unauthorized,
  resolveApiPerms,
  parseBody,
} from "@/lib/api-auth";
import { canView, hasCapability } from "@/lib/permissions";
import { z } from "zod";

const createCostCenterSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(50).optional(),
  active: z.boolean().default(true),
  installationId: z.string().uuid().optional().nullable(),
  accountId: z.string().uuid().optional().nullable(),
});

// ── GET: list cost centers ──

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!canView(perms, "finance")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para ver centros de costo" },
        { status: 403 },
      );
    }

    const costCenters = await prisma.financeCostCenter.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: costCenters });
  } catch (error) {
    console.error("[Finance] Error listing cost centers:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los centros de costo" },
      { status: 500 },
    );
  }
}

// ── POST: create cost center ──

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!hasCapability(perms, "rendicion_configure")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para crear centros de costo" },
        { status: 403 },
      );
    }

    const parsed = await parseBody(request, createCostCenterSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    // Check duplicate code if provided
    if (body.code) {
      const existing = await prisma.financeCostCenter.findFirst({
        where: { tenantId: ctx.tenantId, code: body.code },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Ya existe un centro de costo con ese código" },
          { status: 400 },
        );
      }
    }

    const costCenter = await prisma.financeCostCenter.create({
      data: {
        tenantId: ctx.tenantId,
        name: body.name,
        code: body.code ?? null,
        active: body.active,
        installationId: body.installationId ?? null,
        accountId: body.accountId ?? null,
      },
    });

    return NextResponse.json({ success: true, data: costCenter }, { status: 201 });
  } catch (error) {
    console.error("[Finance] Error creating cost center:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el centro de costo" },
      { status: 500 },
    );
  }
}
