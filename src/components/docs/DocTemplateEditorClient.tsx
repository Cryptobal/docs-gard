"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractEditor } from "./ContractEditor";
import { DOC_CATEGORIES } from "@/lib/docs/token-registry";
import { toast } from "sonner";

interface DocTemplateEditorClientProps {
  templateId?: string; // null = creating new
}

export function DocTemplateEditorClient({
  templateId,
}: DocTemplateEditorClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!templateId);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState("crm");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState<any>(null);
  const [isDefault, setIsDefault] = useState(false);

  const categories = DOC_CATEGORIES[module] || [];

  // Fetch template if editing
  const fetchTemplate = useCallback(async () => {
    if (!templateId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/docs/templates/${templateId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setName(data.data.name);
        setDescription(data.data.description || "");
        setModule(data.data.module);
        setCategory(data.data.category);
        setContent(data.data.content);
        setIsDefault(data.data.isDefault);
      }
    } catch (error) {
      console.error("Error fetching template:", error);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (!category) {
      toast.error("Selecciona una categoría");
      return;
    }
    if (!content) {
      toast.error("El documento no puede estar vacío");
      return;
    }

    setSaving(true);
    try {
      const url = templateId
        ? `/api/docs/templates/${templateId}`
        : "/api/docs/templates";
      const method = templateId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          module,
          category,
          content,
          isDefault,
          ...(templateId ? { changeNote: "Actualización desde editor" } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Error al guardar");
        return;
      }

      toast.success(templateId ? "Template actualizado" : "Template creado");

      if (!templateId && data.data?.id) {
        router.push(`/opai/documentos/templates/${data.data.id}`);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Error al guardar template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/opai/documentos/templates")}
        >
          <ArrowLeft className="h-4 w-4" />
          Templates
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {templateId ? "Guardar Cambios" : "Crear Template"}
        </Button>
      </div>

      {/* Meta fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border border-border bg-white">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Nombre del Template *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Contrato de Servicios de Seguridad"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Módulo *
          </label>
          <select
            value={module}
            onChange={(e) => {
              setModule(e.target.value);
              setCategory("");
            }}
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-white"
          >
            <option value="crm">CRM</option>
            <option value="payroll">Payroll</option>
            <option value="legal">Legal</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Categoría *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-white"
          >
            <option value="">Seleccionar...</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Descripción
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción..."
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Default toggle */}
      <label className="flex items-center gap-2 px-4">
        <input
          type="checkbox"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-xs text-muted-foreground">
          Template por defecto para esta categoría
        </span>
      </label>

      {/* Editor */}
      <ContractEditor
        content={content}
        onChange={setContent}
        filterModules={
          module === "crm"
            ? ["account", "contact", "installation", "deal", "quote", "system"]
            : module === "payroll"
            ? ["system"]
            : ["account", "contact", "system"]
        }
        placeholder="Escribe el contenido del template aquí... Usa el botón 'Insertar Token' para agregar placeholders dinámicos"
      />
    </div>
  );
}
