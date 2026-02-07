/**
 * API Route: /api/cpq/quotes
 * GET  - Listar cotizaciones CPQ
 * POST - Crear cotización CPQ
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";

export async function GET() {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId ?? (await getDefaultTenantId());

    const quotes = await prisma.cpqQuote.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: quotes });
  } catch (error) {
    console.error("Error fetching CPQ quotes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId ?? (await getDefaultTenantId());
    const body = await request.json();

    const clientName = body?.clientName?.trim() || null;
    const validUntil = body?.validUntil ? new Date(body.validUntil) : null;
    const notes = body?.notes?.trim() || null;

    const count = await prisma.cpqQuote.count({ where: { tenantId } });
    const year = new Date().getFullYear();
    const code = `CPQ-${year}-${String(count + 1).padStart(3, "0")}`;

    const quote = await prisma.cpqQuote.create({
      data: {
        tenantId,
        code,
        status: "draft",
        clientName,
        validUntil,
        notes,
      },
    });

    return NextResponse.json({ success: true, data: quote }, { status: 201 });
  } catch (error) {
    console.error("Error creating CPQ quote:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create quote" },
      { status: 500 }
    );
  }
}
