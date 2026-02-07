/**
 * API Route: /api/cpq/roles
 * GET - Listar roles CPQ
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const roles = await prisma.cpqRol.findMany({
      where: active ? { active: active === "true" } : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error("Error fetching CPQ roles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}
