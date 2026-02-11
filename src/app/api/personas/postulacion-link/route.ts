import { NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";
import { buildPostulacionPublicPath, getPostulacionToken } from "@/lib/postulacion-token";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const token = getPostulacionToken();
    const path = buildPostulacionPublicPath(token);
    const absoluteUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}${path}`;

    return NextResponse.json({
      success: true,
      data: {
        path,
        token,
        url: absoluteUrl || path,
      },
    });
  } catch (error) {
    console.error("[PERSONAS] Error building postulacion link:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo construir el link de postulación" },
      { status: 500 }
    );
  }
}
