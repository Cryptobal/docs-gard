/**
 * API Route: /api/docs/sign/[token]/decline
 * POST - Rechazar firma por parte del firmante público
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { declineSignatureSchema } from "@/lib/validations/docs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const raw = await request.json();
    const validation = declineSignatureSchema.safeParse({ ...raw, token });
    if (!validation.success) {
      const issues = validation.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ success: false, error: issues }, { status: 400 });
    }

    const payload = validation.data;
    const recipient = await prisma.docSignatureRecipient.findUnique({
      where: { token },
      include: {
        request: true,
      },
    });

    if (!recipient) {
      return NextResponse.json({ success: false, error: "Token inválido o expirado" }, { status: 404 });
    }

    if (["signed", "declined", "expired"].includes(recipient.status)) {
      return NextResponse.json(
        { success: false, error: `No se puede rechazar un destinatario en estado ${recipient.status}` },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.docSignatureRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "declined",
          declineReason: payload.reason,
          viewedAt: recipient.viewedAt ?? new Date(),
        },
      });

      await tx.docSignatureRequest.update({
        where: { id: recipient.requestId },
        data: {
          status: "cancelled",
        },
      });

      await tx.docSignatureRecipient.updateMany({
        where: {
          requestId: recipient.requestId,
          id: { not: recipient.id },
          status: { in: ["pending", "sent", "viewed"] },
        },
        data: { status: "expired" },
      });

      await tx.document.update({
        where: { id: recipient.request.documentId },
        data: {
          signatureStatus: "cancelled",
        },
      });

      await tx.docHistory.create({
        data: {
          documentId: recipient.request.documentId,
          action: "signature_declined",
          details: {
            requestId: recipient.requestId,
            recipientId: recipient.id,
            reason: payload.reason,
          },
          createdBy: `external:${recipient.email}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error declining signature:", error);
    return NextResponse.json(
      { success: false, error: "Error al rechazar firma" },
      { status: 500 }
    );
  }
}
