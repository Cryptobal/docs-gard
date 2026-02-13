import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";
import { prisma } from "@/lib/prisma";

type Params = { id: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;
    const { id } = await params;

    const take = Math.min(Number(request.nextUrl.searchParams.get("take") || 100), 250);

    const guardia = await prisma.opsGuardia.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!guardia) {
      return NextResponse.json({ success: false, error: "Guardia no encontrado" }, { status: 404 });
    }

    const history = await prisma.opsGuardiaHistory.findMany({
      where: { tenantId: ctx.tenantId, guardiaId: id },
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error("[PERSONAS] Error fetching history:", error);
    return NextResponse.json({ success: false, error: "No se pudo obtener historial" }, { status: 500 });
  }
}
