import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, resolveApiPerms } from "@/lib/api-auth";
import { canView } from "@/lib/permissions";

type Params = { id: string };

// ── GET: payment detail with rendiciones ──

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!canView(perms, "finance", "pagos")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para ver pagos" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const payment = await prisma.financePayment.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        rendiciones: {
          include: {
            item: { select: { id: true, name: true } },
            costCenter: { select: { id: true, name: true } },
            trip: {
              select: {
                id: true,
                distanceKm: true,
                startAddress: true,
                endAddress: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Pago no encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error("[Finance] Error getting payment:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el pago" },
      { status: 500 },
    );
  }
}
