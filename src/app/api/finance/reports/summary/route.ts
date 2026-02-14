import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, resolveApiPerms } from "@/lib/api-auth";
import { canView } from "@/lib/permissions";

// ── GET: summary stats ──

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!canView(perms, "finance", "reportes")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para ver reportes" },
        { status: 403 },
      );
    }

    const tenantId = ctx.tenantId;

    // Parallel queries for counts and sums
    const [
      totalPending,
      totalApproved,
      totalPaid,
      countByStatus,
      countByType,
      allRendiciones,
    ] = await Promise.all([
      // Total amount pending (SUBMITTED + IN_APPROVAL)
      prisma.financeRendicion.aggregate({
        where: { tenantId, status: { in: ["SUBMITTED", "IN_APPROVAL"] } },
        _sum: { amount: true },
        _count: true,
      }),
      // Total amount approved
      prisma.financeRendicion.aggregate({
        where: { tenantId, status: "APPROVED" },
        _sum: { amount: true },
        _count: true,
      }),
      // Total amount paid
      prisma.financeRendicion.aggregate({
        where: { tenantId, status: "PAID" },
        _sum: { amount: true },
        _count: true,
      }),
      // Count by status
      prisma.financeRendicion.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: true,
        _sum: { amount: true },
      }),
      // Count by type
      prisma.financeRendicion.groupBy({
        by: ["type"],
        where: { tenantId },
        _count: true,
        _sum: { amount: true },
      }),
      // Monthly totals (last 12 months)
      prisma.financeRendicion.findMany({
        where: {
          tenantId,
          date: {
            gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 11,
              1,
            ),
          },
        },
        select: { date: true, amount: true },
      }),
    ]);

    // Build monthly totals
    const monthlyMap = new Map<string, number>();
    for (const r of allRendiciones) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + r.amount);
    }

    const totalAmountByMonth = Array.from(monthlyMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      data: {
        totalPending: {
          amount: totalPending._sum.amount ?? 0,
          count: totalPending._count,
        },
        totalApproved: {
          amount: totalApproved._sum.amount ?? 0,
          count: totalApproved._count,
        },
        totalPaid: {
          amount: totalPaid._sum.amount ?? 0,
          count: totalPaid._count,
        },
        countByStatus: countByStatus.map((s) => ({
          status: s.status,
          count: s._count,
          amount: s._sum.amount ?? 0,
        })),
        countByType: countByType.map((t) => ({
          type: t.type,
          count: t._count,
          amount: t._sum.amount ?? 0,
        })),
        totalAmountByMonth,
      },
    });
  } catch (error) {
    console.error("[Finance] Error getting summary:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener las estadísticas" },
      { status: 500 },
    );
  }
}
