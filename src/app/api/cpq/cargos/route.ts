/**
 * API Route: /api/cpq/cargos
 * GET - Listar cargos CPQ
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const cargos = await prisma.cpqCargo.findMany({
      where: active ? { active: active === "true" } : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: cargos });
  } catch (error) {
    console.error("Error fetching CPQ cargos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cargos" },
      { status: 500 }
    );
  }
}
