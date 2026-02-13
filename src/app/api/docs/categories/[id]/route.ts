/**
 * API: /api/docs/categories/[id]
 * PATCH - Actualizar categoría
 * DELETE - Eliminar categoría
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  unauthorized,
  parseBody,
  ensureModuleAccess,
  ensureCanDelete,
} from "@/lib/api-auth";
import { z } from "zod";

const updateCategorySchema = z.object({
  label: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id } = await params;
    const parsed = await parseBody(request, updateCategorySchema);
    if (parsed.error) return parsed.error;

    const existing = await prisma.docCategory.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    const category = await prisma.docCategory.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating doc category:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar categoría" },
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
    const forbiddenModule = await ensureModuleAccess(ctx, "docs");
    if (forbiddenModule) return forbiddenModule;
    const forbiddenDelete = await ensureCanDelete(ctx, "docs", "gestion");
    if (forbiddenDelete) return forbiddenDelete;

    const { id } = await params;

    const existing = await prisma.docCategory.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    await prisma.docCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting doc category:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar categoría" },
      { status: 500 }
    );
  }
}
