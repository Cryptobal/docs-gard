"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Clock,
  Building2,
  User,
  MapPin,
  Handshake,
  History,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractEditor } from "./ContractEditor";
import { DOC_STATUS_CONFIG, DOC_CATEGORIES } from "@/lib/docs/token-registry";
import { toast } from "sonner";
import type { DocDocument, DocHistory } from "@/types/docs";

interface DocDetailClientProps {
  documentId: string;
}

const ENTITY_ICONS: Record<string, React.ComponentType<any>> = {
  crm_account: Building2,
  crm_contact: User,
  crm_installation: MapPin,
  crm_deal: Handshake,
};

const ENTITY_LABELS: Record<string, string> = {
  crm_account: "Cuenta",
  crm_contact: "Contacto",
  crm_installation: "Instalación",
  crm_deal: "Negocio",
};

function getCategoryLabel(module: string, category: string): string {
  const cats = DOC_CATEGORIES[module];
  if (!cats) return category;
  return cats.find((c) => c.key === category)?.label || category;
}

export function DocDetailClient({ documentId }: DocDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doc, setDoc] = useState<DocDocument | null>(null);
  const [content, setContent] = useState<any>(null);
  const [status, setStatus] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<DocHistory[]>([]);

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/docs/documents/${documentId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setDoc(data.data);
        setContent(data.data.content);
        setStatus(data.data.status);
        setHistory(data.data.history || []);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/docs/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          status: status !== doc.status ? status : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Documento guardado");
        setDoc(data.data);
      } else {
        toast.error(data.error || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este documento permanentemente?")) return;
    try {
      await fetch(`/api/docs/documents/${documentId}`, { method: "DELETE" });
      toast.success("Documento eliminado");
      router.push("/opai/documentos");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-20">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Documento no encontrado</p>
      </div>
    );
  }

  const statusConfig = DOC_STATUS_CONFIG[doc.status];
  const isEditable = ["draft", "review"].includes(doc.status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/opai/documentos")}
        >
          <ArrowLeft className="h-4 w-4" />
          Documentos
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History className="h-3.5 w-3.5" />
          Historial
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        {isEditable && (
          <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Guardar
          </Button>
        )}
      </div>

      {/* Document info panel */}
      <div className="flex items-start gap-4 flex-wrap p-4 rounded-xl border border-border bg-white">
        <div className="flex-1 min-w-[200px]">
          <h2 className="text-lg font-semibold">{doc.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {doc.module.toUpperCase()} · {getCategoryLabel(doc.module, doc.category)}
            {doc.template && ` · Template: ${doc.template.name}`}
          </p>
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={!isEditable && doc.status !== "approved"}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {Object.entries(DOC_STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
          {status !== doc.status && (
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              Actualizar
            </Button>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {doc.effectiveDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Inicio: {new Date(doc.effectiveDate).toLocaleDateString("es-CL")}
            </span>
          )}
          {doc.expirationDate && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Vence: {new Date(doc.expirationDate).toLocaleDateString("es-CL")}
            </span>
          )}
        </div>
      </div>

      {/* Associations */}
      {doc.associations && doc.associations.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          <span className="text-xs text-muted-foreground">Asociado a:</span>
          {doc.associations.map((assoc) => {
            const Icon = ENTITY_ICONS[assoc.entityType] || FileText;
            return (
              <span
                key={assoc.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs"
              >
                <Icon className="h-3 w-3" />
                {ENTITY_LABELS[assoc.entityType] || assoc.entityType}
              </span>
            );
          })}
        </div>
      )}

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <h3 className="text-sm font-semibold mb-3">Historial de Cambios</h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 text-xs text-muted-foreground"
              >
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                <span className="font-medium">{h.action}</span>
                {h.details?.from && h.details?.to && (
                  <span>
                    {h.details.from} → {h.details.to}
                  </span>
                )}
                <span className="ml-auto">
                  {new Date(h.createdAt).toLocaleDateString("es-CL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <ContractEditor content={content} onChange={setContent} editable={isEditable} />
    </div>
  );
}
