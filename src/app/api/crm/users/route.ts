/**
 * API Route: /api/crm/users
 * GET - List active users for @mentions in notes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET() {
  const ctx = await requireAuth();
  if (!ctx) return unauthorized();

  const users = await prisma.admin.findMany({
    where: {
      tenantId: ctx.tenantId,
      status: "active",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: users });
}
