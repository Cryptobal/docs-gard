import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";

/**
 * GET /api/personas/guardias/[id]/dias-trabajados
 * Lista días trabajados (asistio/reemplazo) del guardia con resumen por mes.
 * Query: from, to (YYYY-MM-DD; por defecto últimos 12 meses).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id: guardiaId } = await params;
    const fromParam = request.nextUrl.searchParams.get("from");
    const toParam = request.nextUrl.searchParams.get("to");

    const now = new Date();
    const to = toParam ? new Date(`${toParam}T00:00:00.000Z`) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const from = fromParam
      ? new Date(`${fromParam}T00:00:00.000Z`)
      : new Date(Date.UTC(to.getUTCFullYear() - 1, to.getUTCMonth(), to.getUTCDate() + 1));

    const items = await prisma.opsAsistenciaDiaria.findMany({
      where: {
        tenantId: ctx.tenantId,
        attendanceStatus: { in: ["asistio", "reemplazo"] },
        OR: [
          { actualGuardiaId: guardiaId },
          { replacementGuardiaId: guardiaId },
        ],
        date: { gte: from, lte: to },
      },
      select: {
        id: true,
        date: true,
        puestoId: true,
        slotNumber: true,
        attendanceStatus: true,
        installation: { select: { id: true, name: true } },
        puesto: { select: { id: true, name: true, shiftStart: true, shiftEnd: true } },
      },
      orderBy: { date: "desc" },
    });

    const summaryByMonth: Record<string, number> = {};
    for (const item of items) {
      const d = typeof item.date === "string" ? new Date(item.date) : item.date;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      summaryByMonth[key] = (summaryByMonth[key] ?? 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((i) => ({
          id: i.id,
          date: i.date instanceof Date ? i.date.toISOString().slice(0, 10) : i.date,
          puestoId: i.puestoId,
          slotNumber: i.slotNumber,
          attendanceStatus: i.attendanceStatus,
          installationName: i.installation.name,
          puestoName: i.puesto.name,
          shiftStart: i.puesto.shiftStart,
          shiftEnd: i.puesto.shiftEnd,
        })),
        summaryByMonth,
      },
    });
  } catch (error) {
    console.error("[GUARDIAS] Error fetching días trabajados:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los días trabajados" },
      { status: 500 }
    );
  }
}
