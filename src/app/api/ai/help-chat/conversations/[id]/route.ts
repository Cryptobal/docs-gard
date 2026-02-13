import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { canUseAiHelpChat, getAiHelpChatConfig } from "@/lib/ai/help-chat-config";

type Params = { id: string };

function hasChatPersistence(): boolean {
  const db = prisma as unknown as Record<string, unknown>;
  return Boolean(db.aiChatConversation && db.aiChatMessage);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
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
      return NextResponse.json(
        { success: false, error: "Persistencia de conversación no disponible" },
        { status: 404 },
      );
    }

    const { id } = await params;
    const conversation = await prisma.aiChatConversation.findFirst({
      where: {
        id,
        tenantId: ctx.tenantId,
        userId: ctx.userId,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "asc" }],
          take: 120,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversación no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Error fetching AI chat conversation:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener la conversación" },
      { status: 500 },
    );
  }
}
