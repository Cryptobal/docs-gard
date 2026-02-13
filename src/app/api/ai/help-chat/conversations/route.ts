import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { canUseAiHelpChat, getAiHelpChatConfig } from "@/lib/ai/help-chat-config";

function hasChatPersistence(): boolean {
  const db = prisma as unknown as Record<string, unknown>;
  return Boolean(db.aiChatConversation && db.aiChatMessage);
}

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const cfg = await getAiHelpChatConfig(ctx.tenantId);
    if (!canUseAiHelpChat(ctx.userRole, cfg)) {
      return NextResponse.json(
        { success: false, error: "No tienes acceso al asistente" },
        { status: 403 },
      );
    }

    if (!hasChatPersistence()) {
      return NextResponse.json({
        success: true,
        data: [],
        persistenceEnabled: false,
      });
    }

    const conversations = await prisma.aiChatConversation.findMany({
      where: {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 30,
    });

    return NextResponse.json({
      success: true,
      data: conversations,
      persistenceEnabled: true,
    });
  } catch (error) {
    console.error("Error listing AI chat conversations:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener las conversaciones" },
      { status: 500 },
    );
  }
}
