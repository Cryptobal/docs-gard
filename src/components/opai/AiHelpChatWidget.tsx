"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2, MessageCircle, Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

const MAX_VISIBLE_MESSAGES = 120;

export function AiHelpChatWidget() {
  const [open, setOpen] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isNewConversation, setIsNewConversation] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoadingConfig(true);
      try {
        const res = await fetch("/api/ai/help-chat/config");
        const json = await res.json();
        if (json.success) {
          setCanAccess(Boolean(json.data?.canAccess));
        }
      } catch {
        setCanAccess(false);
      } finally {
        setLoadingConfig(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!canAccess || !open) return;
    void (async () => {
      try {
        const res = await fetch("/api/ai/help-chat/conversations");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setConversations(json.data);
          setPersistenceEnabled(json.persistenceEnabled !== false);
          if (!activeConversationId && !isNewConversation && json.data.length > 0) {
            setActiveConversationId(json.data[0].id);
          }
        }
      } catch {
        // noop
      }
    })();
  }, [canAccess, open, activeConversationId, isNewConversation]);

  useEffect(() => {
    if (!canAccess || !activeConversationId || !open) return;
    void (async () => {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/ai/help-chat/conversations/${activeConversationId}`);
        const json = await res.json();
        if (json.success && json.data?.messages) {
          setMessages((json.data.messages as ChatMessage[]).slice(-MAX_VISIBLE_MESSAGES));
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    })();
  }, [canAccess, activeConversationId, open]);

  const startNewConversation = () => {
    setActiveConversationId(null);
    setIsNewConversation(true);
    setMessages([]);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const optimisticUser: ChatMessage = {
      id: `tmp-user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser].slice(-MAX_VISIBLE_MESSAGES));
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/help-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId: activeConversationId ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "No se pudo enviar el mensaje");
      }

      const newConversationId = json.data?.conversationId as string;
      const assistant = json.data?.assistantMessage as ChatMessage | undefined;
      setPersistenceEnabled(json.data?.persistenceEnabled !== false);

      if (newConversationId) {
        setActiveConversationId(newConversationId);
        setIsNewConversation(false);
      }
      if (assistant) {
        setMessages((prev) => [...prev, assistant].slice(-MAX_VISIBLE_MESSAGES));
      }

      const listRes = await fetch("/api/ai/help-chat/conversations");
      const listJson = await listRes.json();
      if (listJson.success && Array.isArray(listJson.data)) {
        setConversations(listJson.data);
        setPersistenceEnabled(listJson.persistenceEnabled !== false);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-assistant-${Date.now()}`,
          role: "assistant",
          content:
            (error as Error).message ||
            "Ocurrió un error al responder. Intenta nuevamente.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loadingConfig || !canAccess) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 md:right-6 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-[1.03] bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] md:bottom-6"
        aria-label="Abrir asistente IA"
      >
        <MessageCircle className="mx-auto h-5 w-5" />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Desktop: panel anclado abajo derecha */}
          <div className="hidden md:flex fixed right-6 bottom-24 z-50 h-[68vh] max-h-[680px] w-[420px] flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-base font-semibold">
                <Bot className="h-4 w-4 text-primary" />
                Asistente IA
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Cerrar asistente IA"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={startNewConversation}>
                  <Plus className="h-3.5 w-3.5" />
                  Nueva
                </Button>
                <select
                  className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs"
                  value={activeConversationId ?? ""}
                  onChange={(e) => {
                    setActiveConversationId(e.target.value || null);
                    setIsNewConversation(false);
                  }}
                  disabled={!persistenceEnabled}
                >
                  <option value="">Conversación nueva</option>
                  {conversations.map((conv) => (
                    <option key={conv.id} value={conv.id}>
                      {conv.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Pregúntame cómo usar la aplicación o consulta datos operativos de guardias y métricas.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Escribe tu pregunta..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => void sendMessage()}
                  disabled={sending || !input.trim()}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile: full-screen */}
          <div className="md:hidden fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2 text-base font-semibold">
                <Bot className="h-4 w-4 text-primary" />
                Asistente IA
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Cerrar asistente IA"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={startNewConversation}>
                  <Plus className="h-3.5 w-3.5" />
                  Nueva
                </Button>
                <select
                  className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs"
                  value={activeConversationId ?? ""}
                  onChange={(e) => {
                    setActiveConversationId(e.target.value || null);
                    setIsNewConversation(false);
                  }}
                  disabled={!persistenceEnabled}
                >
                  <option value="">Conversación nueva</option>
                  {conversations.map((conv) => (
                    <option key={conv.id} value={conv.id}>
                      {conv.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Pregúntame cómo usar la aplicación o consulta datos operativos de guardias y métricas.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[92%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      msg.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Escribe tu pregunta..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => void sendMessage()}
                  disabled={sending || !input.trim()}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
