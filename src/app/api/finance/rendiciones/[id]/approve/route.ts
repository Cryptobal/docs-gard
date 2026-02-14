import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, resolveApiPerms, parseBody } from "@/lib/api-auth";
import { hasCapability } from "@/lib/permissions";
import { notifyRendicionApproved } from "@/lib/finance-notifications";
import { z } from "zod";

type Params = { id: string };

const approveSchema = z.object({
  comment: z.string().max(500).optional(),
});

// ── POST: approve rendicion ──

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!hasCapability(perms, "rendicion_approve")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para aprobar rendiciones" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const parsed = await parseBody(request, approveSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const rendicion = await prisma.financeRendicion.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { approvals: true },
    });

    if (!rendicion) {
      return NextResponse.json(
        { success: false, error: "Rendición no encontrada" },
        { status: 404 },
      );
    }

    if (!["SUBMITTED", "IN_APPROVAL"].includes(rendicion.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Solo se puede aprobar en estado SUBMITTED o IN_APPROVAL (actual: ${rendicion.status})`,
        },
        { status: 400 },
      );
    }

    // Find approval record for current user
    const myApproval = rendicion.approvals.find(
      (a) => a.approverId === ctx.userId,
    );
    if (!myApproval) {
      return NextResponse.json(
        { success: false, error: "No eres aprobador de esta rendición" },
        { status: 403 },
      );
    }

    if (myApproval.decision) {
      return NextResponse.json(
        { success: false, error: "Ya has tomado una decisión sobre esta rendición" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update this approval
      await tx.financeApproval.update({
        where: { id: myApproval.id },
        data: {
          decision: "APPROVED",
          comment: body.comment ?? null,
          decidedAt: new Date(),
        },
      });

      // Check if all approvers have approved
      const allApprovals = await tx.financeApproval.findMany({
        where: { rendicionId: id },
      });

      const pendingApprovals = allApprovals.filter(
        (a) => a.id !== myApproval.id && !a.decision,
      );

      const allApproved = pendingApprovals.length === 0;

      const newStatus = allApproved ? "APPROVED" : "IN_APPROVAL";

      const updated = await tx.financeRendicion.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.financeRendicionHistory.create({
        data: {
          rendicionId: id,
          action: "APPROVED",
          fromStatus: rendicion.status,
          toStatus: newStatus,
          userId: ctx.userId,
          userName: ctx.userEmail,
          comment: body.comment ?? null,
          metadata: allApproved
            ? { fullyApproved: true }
            : { partialApproval: true, remaining: pendingApprovals.length },
        },
      });

      return { updated, allApproved: allApproved };
    });

    // Send email to submitter when fully approved (fire-and-forget)
    if (result.allApproved) {
      const submitter = await prisma.admin.findUnique({
        where: { id: rendicion.submitterId },
        select: { email: true },
      });
      const approver = await prisma.admin.findUnique({
        where: { id: ctx.userId },
        select: { name: true },
      });
      if (submitter?.email) {
        notifyRendicionApproved({
          rendicionCode: rendicion.code,
          amount: rendicion.amount,
          submitterEmail: submitter.email,
          approverName: approver?.name ?? ctx.userEmail,
        }).catch((err) =>
          console.error("[Finance] Error sending approve notification:", err),
        );
      }
    }

    return NextResponse.json({ success: true, data: result.updated });
  } catch (error) {
    console.error("[Finance] Error approving rendicion:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo aprobar la rendición" },
      { status: 500 },
    );
  }
}
