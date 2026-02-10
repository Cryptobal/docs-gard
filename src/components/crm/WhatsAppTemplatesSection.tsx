/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  MessageSquare,
  RotateCcw,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

type WaTemplate = {
  slug: string;
  name: string;
  body: string;
  isActive: boolean;
  tokens: string[];
  saved: boolean;
};

// Mapeo slug → descripción
const SLUG_DESCRIPTIONS: Record<string, string> = {
  lead_commercial:
    "Mensaje que se pre-llena cuando haces clic en el botón WhatsApp del email de nuevo lead.",
  lead_client:
    "Mensaje pre-llenado que el cliente ve al hacer clic en el botón WhatsApp del email de confirmación.",
  proposal_sent:
    "Mensaje al compartir la propuesta por WhatsApp después de enviarla por email.",
  followup_first:
    "Mensaje de WhatsApp en la notificación del 1er seguimiento automático.",
  followup_second:
    "Mensaje de WhatsApp en la notificación del 2do seguimiento automático.",
};

export function WhatsAppTemplatesSection() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [editedBodies, setEditedBodies] = useState<Record<string, string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/crm/whatsapp-templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTemplates(data.data);
        }
      })
      .catch(() => toast.error("Error cargando plantillas de WhatsApp"))
      .finally(() => setLoading(false));
  }, [open]);

  const getBody = (slug: string) => {
    if (editedBodies[slug] !== undefined) return editedBodies[slug];
    return templates.find((t) => t.slug === slug)?.body ?? "";
  };

  const setBody = (slug: string, body: string) => {
    setEditedBodies((prev) => ({ ...prev, [slug]: body }));
  };

  const isDirty = (slug: string) => {
    const original = templates.find((t) => t.slug === slug)?.body ?? "";
    return editedBodies[slug] !== undefined && editedBodies[slug] !== original;
  };

  const saveTemplate = async (slug: string) => {
    setSavingSlug(slug);
    try {
      const res = await fetch("/api/crm/whatsapp-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body: getBody(slug) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");

      // Actualizar template en la lista
      setTemplates((prev) =>
        prev.map((t) =>
          t.slug === slug ? { ...t, body: getBody(slug), saved: true } : t
        )
      );
      // Limpiar estado dirty
      setEditedBodies((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
      toast.success("Plantilla guardada");
    } catch {
      toast.error("No se pudo guardar la plantilla");
    } finally {
      setSavingSlug(null);
    }
  };

  const resetToDefault = (slug: string) => {
    // Fetch defaults from the original template list (if not saved, it's already default)
    // We need to refetch or store defaults separately
    fetch("/api/crm/whatsapp-templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // The API returns default body when no saved template exists
          // To reset, we delete the saved template and use default
          const original = data.data.find(
            (t: WaTemplate) => t.slug === slug
          );
          if (original) {
            setBody(slug, original.body);
          }
        }
      });
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success(`${token} copiado`);
  };

  const previewBody = (body: string) => {
    // Reemplazar tokens con ejemplos para preview
    const examples: Record<string, string> = {
      "{nombre}": "Cristian",
      "{apellido}": "Pérez",
      "{empresa}": "XPE Consult",
      "{direccion}": "Av. Nueva Costanera 3698, Vitacura",
      "{comuna}": "Vitacura",
      "{ciudad}": "Santiago",
      "{servicio}": "Guardias de Seguridad",
      "{dotacion}": "Ronda: 4 guardia(s); Control de Acceso: 2 guardia(s)",
      "{email}": "cristian@xpeconsult.cl",
      "{celular}": "+56912345678",
      "{pagina_web}": "https://xpeconsult.cl",
      "{industria}": "Consultoría",
      "{detalle}": "Necesitamos cobertura 24/7",
      "{contactName}": "Cristian",
      "{companyName}": "XPE Consult",
      "{proposalUrl}": "https://opai.gard.cl/p/abc123",
      "{dealTitle}": "Oportunidad XPE Consult",
      "{accountName}": "XPE Consult",
      "{proposalLink}": "https://opai.gard.cl/p/abc123",
      "{proposalSentDate}": "3 de febrero de 2026",
    };

    let result = body;
    for (const [token, value] of Object.entries(examples)) {
      result = result.replaceAll(token, value);
    }
    return result;
  };

  return (
    <Card className="lg:col-span-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left hover:bg-accent/50 transition-colors rounded-t-lg"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Plantillas de WhatsApp
            </CardTitle>
            <CardDescription>
              Edita los mensajes pre-llenados de WhatsApp para leads, propuestas
              y seguimientos.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {templates.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/30 text-emerald-500"
              >
                {templates.length} plantillas
              </Badge>
            )}
            {open ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
          </div>
        </CardHeader>
      </button>

      {open && (
        <CardContent className="space-y-6 text-sm">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Error cargando plantillas. Intenta de nuevo.
            </p>
          ) : (
            <div className="space-y-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.slug}
                  className="rounded-lg border border-border overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                    <div>
                      <p className="font-medium text-sm">{tpl.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {SLUG_DESCRIPTIONS[tpl.slug] || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isDirty(tpl.slug) && (
                        <Badge
                          variant="outline"
                          className="text-[9px] border-amber-500/40 text-amber-500"
                        >
                          Sin guardar
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          setPreviewSlug(
                            previewSlug === tpl.slug ? null : tpl.slug
                          )
                        }
                        title={
                          previewSlug === tpl.slug
                            ? "Ocultar preview"
                            : "Ver preview"
                        }
                      >
                        {previewSlug === tpl.slug ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    {/* Tokens disponibles */}
                    <div>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Tokens disponibles (clic para copiar)
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tpl.tokens.map((token) => (
                          <button
                            key={token}
                            type="button"
                            onClick={() => copyToken(token)}
                            className="inline-flex items-center gap-0.5 rounded bg-muted/60 border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                            title={`Copiar ${token}`}
                          >
                            <Copy className="h-2.5 w-2.5" />
                            {token}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={getBody(tpl.slug)}
                      onChange={(e) => setBody(tpl.slug, e.target.value)}
                      rows={6}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono resize-y"
                      placeholder="Escribe tu mensaje aquí..."
                    />

                    {/* Preview */}
                    {previewSlug === tpl.slug && (
                      <div className="rounded-lg bg-[#e5ddd5] dark:bg-[#0b141a] p-4 space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Preview (datos de ejemplo)
                        </Label>
                        <div className="inline-block max-w-[85%] bg-[#dcf8c6] dark:bg-[#005c4b] rounded-lg px-3 py-2 text-sm text-[#111b21] dark:text-[#e9edef] shadow-sm whitespace-pre-wrap">
                          {previewBody(getBody(tpl.slug))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => resetToDefault(tpl.slug)}
                        title="Restaurar texto por defecto"
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Restaurar default
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => saveTemplate(tpl.slug)}
                        disabled={
                          savingSlug === tpl.slug || !isDirty(tpl.slug)
                        }
                      >
                        {savingSlug === tpl.slug ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="mr-1 h-3 w-3" />
                        )}
                        Guardar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
