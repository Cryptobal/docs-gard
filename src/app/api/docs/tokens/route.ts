/**
 * API Route: /api/docs/tokens
 * GET - Obtener tokens disponibles por módulo
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { TOKEN_MODULES, DOC_CATEGORIES, DOC_STATUS_CONFIG } from "@/lib/docs/token-registry";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module");

    let modules = TOKEN_MODULES;
    if (module) {
      modules = TOKEN_MODULES.filter((m) => m.key === module);
    }

    return NextResponse.json({
      success: true,
      data: {
        modules,
        categories: DOC_CATEGORIES,
        statuses: DOC_STATUS_CONFIG,
      },
    });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener tokens" },
      { status: 500 }
    );
  }
}
