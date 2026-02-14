import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, resolveApiPerms } from "@/lib/api-auth";
import { canDelete } from "@/lib/permissions";
import { deleteFile } from "@/lib/storage";

type Params = { id: string };

// ── DELETE: remove attachment from R2 and DB ──

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!canDelete(perms, "finance", "rendiciones")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para eliminar adjuntos" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const attachment = await prisma.financeAttachment.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: "Adjunto no encontrado" },
        { status: 404 },
      );
    }

    // Delete from R2
    try {
      await deleteFile(attachment.storageKey);
    } catch (err) {
      console.error("[Finance] Error deleting file from R2:", err);
      // Continue with DB delete even if R2 fails
    }

    // Delete from DB
    await prisma.financeAttachment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Finance] Error deleting attachment:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar el adjunto" },
      { status: 500 },
    );
  }
}
