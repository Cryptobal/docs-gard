import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { canUseAiHelpChat, getAiHelpChatConfig } from "@/lib/ai/help-chat-config";
import { retrieveDocsContext } from "@/lib/ai/help-chat-retrieval";
import { getGuardiasMetrics, searchGuardiasByNameOrRut } from "@/lib/ai/help-chat-tools";

const MODEL = "gpt-4o-mini";

function hasChatPersistence(): boolean {
  const db = prisma as unknown as Record<string, unknown>;
  return Boolean(db.aiChatConversation && db.aiChatMessage);
}

function fallbackMessage(question: string): string {
  return `No tengo suficiente información para asegurar esto. ¿Quieres que te deje la pregunta para hacerla al administrador? Cópiala y pégala tal cual: "${question}"`;
}

function clipTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "Nueva conversación";
  return clean.length > 90 ? `${clean.slice(0, 87)}...` : clean;
}

type ToolCallResult = {
  toolCallsUsed: number;
  assistantText: string;
};

async function runModelWithTools(params: {
  userMessage: string;
  docsContext: string;
  tenantId: string;
  allowDataQuestions: boolean;
}): Promise<ToolCallResult> {
  const { userMessage, docsContext, tenantId, allowDataQuestions } = params;
  let toolCallsUsed = 0;

  const baseMessages: Array<Record<string, unknown>> = [
    {
      role: "system",
      content:
        "Eres un asistente de ayuda funcional de una aplicación SaaS interna. " +
        "Reglas obligatorias: " +
        "1) Nunca inventes datos, nunca infieras datos duros y nunca inventes pasos internos. " +
        "2) Si no hay información suficiente para responder con certeza, responde exactamente con el texto de fallback que se te indique. " +
        "3) Explica de forma clara y accionable, sin mencionar archivos, rutas técnicas ni ubicación de documentos. " +
        "4) No cites fuentes textuales; responde como explicación directa al usuario final. " +
        "5) Si hay datos de guardias o métricas entregados por herramientas, úsalos tal cual y aclara cuando un campo viene vacío.",
    },
    {
      role: "system",
      content:
        `Contexto documental disponible:\n${docsContext || "[sin contexto documental relevante]"}` +
        "\n\nTexto fallback obligatorio cuando falte contexto: " +
        `"${fallbackMessage(userMessage)}"`,
    },
    { role: "user", content: userMessage },
  ];

  const tools = allowDataQuestions
    ? [
        {
          type: "function",
          function: {
            name: "search_guardias",
            description:
              "Busca guardias por nombre, apellido, RUT o código para responder preguntas operativas puntuales.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string", description: "Texto de búsqueda (nombre, RUT o código)." },
                limit: { type: "number", description: "Cantidad máxima de resultados (1-20)." },
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_guardias_metrics",
            description: "Obtiene métricas agregadas de guardias del tenant actual.",
            parameters: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
          },
        },
      ]
    : [];

  let messages = [...baseMessages];
  let finalText = "";

  for (let step = 0; step < 4; step += 1) {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: messages as never,
      tools: tools.length > 0 ? (tools as never) : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
      temperature: 0.2,
      max_tokens: 700,
    });

    const choice = completion.choices[0]?.message;
    const toolCalls = choice?.tool_calls ?? [];

    if (!toolCalls.length) {
      finalText = choice?.content?.trim() || "";
      break;
    }

    toolCallsUsed += toolCalls.length;
    messages.push({
      role: "assistant",
      content: choice?.content ?? "",
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      if (call.type !== "function") {
        continue;
      }
      const toolName = call.function.name;
      const args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
      let result: unknown = { ok: false, error: "Herramienta no soportada" };

      if (toolName === "search_guardias") {
        const query = typeof args.query === "string" ? args.query : "";
        const limit = typeof args.limit === "number" ? args.limit : 8;
        try {
          result = {
            ok: true,
            data: await searchGuardiasByNameOrRut(tenantId, query, limit),
          };
        } catch {
          result = {
            ok: false,
            error: "No fue posible consultar guardias en este momento.",
          };
        }
      } else if (toolName === "get_guardias_metrics") {
        try {
          result = {
            ok: true,
            data: await getGuardiasMetrics(tenantId),
          };
        } catch {
          result = {
            ok: false,
            error: "No fue posible consultar métricas en este momento.",
          };
        }
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return { toolCallsUsed, assistantText: finalText };
}

export async function POST(request: NextRequest) {
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

    const body = (await request.json().catch(() => ({}))) as {
      message?: unknown;
      conversationId?: unknown;
    };

    const userMessage = typeof body.message === "string" ? body.message.trim() : "";
    if (!userMessage) {
      return NextResponse.json(
        { success: false, error: "El mensaje es obligatorio" },
        { status: 400 },
      );
    }

    const persistenceEnabled = hasChatPersistence();
    const existingConversationId =
      persistenceEnabled && typeof body.conversationId === "string" ? body.conversationId : undefined;

    const conversation = persistenceEnabled
      ? existingConversationId
        ? await prisma.aiChatConversation.findFirst({
            where: {
              id: existingConversationId,
              tenantId: ctx.tenantId,
              userId: ctx.userId,
            },
          })
        : await prisma.aiChatConversation.create({
            data: {
              tenantId: ctx.tenantId,
              userId: ctx.userId,
              title: clipTitle(userMessage),
            },
          })
      : null;

    if (persistenceEnabled && !conversation) {
      return NextResponse.json(
        { success: false, error: "No se encontró la conversación" },
        { status: 404 },
      );
    }

    if (persistenceEnabled && conversation) {
      await prisma.aiChatMessage.create({
        data: {
          conversationId: conversation.id,
          tenantId: ctx.tenantId,
          role: "user",
          content: userMessage,
        },
      });
    }

    const docsChunks = await retrieveDocsContext(userMessage, 6);
    const docsContext = docsChunks
      .map(
        (item, index) =>
          `Bloque ${index + 1} (${item.title}):\n${item.body}`,
      )
      .join("\n\n");

    let assistantText = "";
    if (docsChunks.length === 0 && !cfg.allowDataQuestions) {
      assistantText = fallbackMessage(userMessage);
    } else {
      const modelResult = await runModelWithTools({
        userMessage,
        docsContext,
        tenantId: ctx.tenantId,
        allowDataQuestions: cfg.allowDataQuestions,
      });
      assistantText = modelResult.assistantText || fallbackMessage(userMessage);
      if (
        docsChunks.length === 0 &&
        modelResult.toolCallsUsed === 0 &&
        !assistantText.includes("No tengo suficiente información para asegurar esto")
      ) {
        assistantText = fallbackMessage(userMessage);
      }
    }

    const assistantMessage =
      persistenceEnabled && conversation
        ? await prisma.aiChatMessage.create({
            data: {
              conversationId: conversation.id,
              tenantId: ctx.tenantId,
              role: "assistant",
              content: assistantText,
            },
            select: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
            },
          })
        : {
            id: `ephemeral-${Date.now()}`,
            role: "assistant" as const,
            content: assistantText,
            createdAt: new Date(),
          };

    if (persistenceEnabled && conversation) {
      await prisma.aiChatConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation?.id ?? null,
        assistantMessage,
        persistenceEnabled,
      },
    });
  } catch (error) {
    console.error("Error in AI Help Chat:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo responder la consulta" },
      { status: 500 },
    );
  }
}
