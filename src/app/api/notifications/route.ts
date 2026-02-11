/**
 * API Route: /api/notifications
 * GET    - Listar notificaciones del tenant
 * PATCH  - Marcar notificaciones como leídas
 * DELETE - Eliminar notificaciones (todas o por IDs)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const notifications = await prisma.notification.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { tenantId: ctx.tenantId, read: false },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      meta: { unreadCount },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const body = await request.json();

    if (body.markAllRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { tenantId: ctx.tenantId, read: false },
        data: { read: true },
      });
    } else if (body.ids && Array.isArray(body.ids)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: body.ids },
          tenantId: ctx.tenantId,
        },
        data: { read: true },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Provide 'markAllRead: true' or 'ids: string[]'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const body = await request.json();

    if (body.deleteAll) {
      await prisma.notification.deleteMany({
        where: { tenantId: ctx.tenantId },
      });
    } else if (body.ids && Array.isArray(body.ids)) {
      await prisma.notification.deleteMany({
        where: {
          id: { in: body.ids },
          tenantId: ctx.tenantId,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Provide 'deleteAll: true' or 'ids: string[]'" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}
