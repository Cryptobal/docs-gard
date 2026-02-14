/**
 * API Route: /api/cron/finance-alerts
 * GET - Find overdue rendiciones and pending approvals, log alerts
 *
 * Runs daily at 8 AM via Vercel Cron.
 * Protected with CRON_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "CRON_SECRET not configured" },
        { status: 500 },
      );
    }
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get all tenant configs
    const configs = await prisma.financeRendicionConfig.findMany();

    let alertCount = 0;

    for (const config of configs) {
      // ── 1. Rendiciones pending too long ───────────────────────────────
      const pendingCutoff = new Date();
      pendingCutoff.setDate(pendingCutoff.getDate() - config.pendingAlertDays);

      const pendingRendiciones = await prisma.financeRendicion.findMany({
        where: {
          tenantId: config.tenantId,
          status: { in: ["SUBMITTED", "IN_APPROVAL"] },
          submittedAt: { lt: pendingCutoff },
        },
        select: { id: true, code: true, submitterId: true },
      });

      alertCount += pendingRendiciones.length;

      if (pendingRendiciones.length > 0) {
        console.log(
          `[Finance Alerts] Tenant ${config.tenantId}: ${pendingRendiciones.length} rendiciones pendientes hace más de ${config.pendingAlertDays} días`,
        );
      }

      // ── 2. Approvals overdue ──────────────────────────────────────────
      const approvalCutoff = new Date();
      approvalCutoff.setDate(
        approvalCutoff.getDate() - config.approvalAlertDays,
      );

      const overdueApprovals = await prisma.financeApproval.findMany({
        where: {
          rendicion: {
            tenantId: config.tenantId,
            status: { in: ["SUBMITTED", "IN_APPROVAL"] },
          },
          decision: null,
          createdAt: { lt: approvalCutoff },
        },
        select: {
          id: true,
          approverId: true,
          rendicion: { select: { id: true, code: true } },
        },
      });

      alertCount += overdueApprovals.length;

      if (overdueApprovals.length > 0) {
        console.log(
          `[Finance Alerts] Tenant ${config.tenantId}: ${overdueApprovals.length} aprobaciones pendientes hace más de ${config.approvalAlertDays} días`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      alertCount,
      tenantsChecked: configs.length,
    });
  } catch (error) {
    console.error("[Finance Alerts] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error processing alerts" },
      { status: 500 },
    );
  }
}
