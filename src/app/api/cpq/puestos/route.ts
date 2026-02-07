/**
 * API Route: /api/cpq/puestos
 * GET - Listar puestos de trabajo CPQ
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const puestos = await prisma.cpqPuestoTrabajo.findMany({
      where: active ? { active: active === "true" } : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: puestos });
  } catch (error) {
    console.error("Error fetching CPQ puestos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch puestos" },
      { status: 500 }
    );
  }
}
