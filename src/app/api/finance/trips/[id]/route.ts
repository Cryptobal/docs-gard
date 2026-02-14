import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuth,
  unauthorized,
  resolveApiPerms,
  parseBody,
} from "@/lib/api-auth";
import { canView, canEdit, hasCapability } from "@/lib/permissions";
import { z } from "zod";

type Params = { id: string };

const updateTripSchema = z.object({
  tollAmount: z.number().int().min(0),
});

// ── GET: trip detail ──

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!canView(perms, "finance", "rendiciones")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para ver viajes" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const viewAll = hasCapability(perms, "rendicion_view_all");

    const trip = await prisma.financeTrip.findFirst({
      where: {
        id,
        tenantId: ctx.tenantId,
        ...(!viewAll ? { submitterId: ctx.userId } : {}),
      },
      include: {
        rendicion: {
          select: { id: true, code: true, status: true, amount: true },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Viaje no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error) {
    console.error("[Finance] Error getting trip:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el viaje" },
      { status: 500 },
    );
  }
}

// ── PATCH: update toll amount ──

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!canEdit(perms, "finance", "rendiciones")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para editar viajes" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const parsed = await parseBody(request, updateTripSchema);
    if (parsed.error) return parsed.error;
    const { tollAmount } = parsed.data;

    const trip = await prisma.financeTrip.findFirst({
      where: { id, tenantId: ctx.tenantId, submitterId: ctx.userId },
    });

    if (!trip) {
      return NextResponse.json(
        { success: false, error: "Viaje no encontrado" },
        { status: 404 },
      );
    }

    // Recalculate totalAmount with new toll
    const subtotal = trip.subtotal ?? 0;
    const newTotalAmount = subtotal + tollAmount;

    const result = await prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.financeTrip.update({
        where: { id },
        data: {
          tollAmount,
          totalAmount: newTotalAmount,
        },
      });

      // Update linked rendicion amount if exists
      if (trip.status === "COMPLETED") {
        await tx.financeRendicion.updateMany({
          where: { tripId: id, tenantId: ctx.tenantId },
          data: { amount: newTotalAmount },
        });
      }

      return updatedTrip;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[Finance] Error updating trip:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el viaje" },
      { status: 500 },
    );
  }
}
