"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FilePlus2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DOCUMENT_TYPES, normalizeMobileNineDigits, normalizeRut } from "@/lib/personas";

const DOC_LABEL: Record<string, string> = {
  certificado_antecedentes: "Certificado de antecedentes",
  certificado_os10: "Certificado OS-10",
  cedula_identidad: "Cédula de identidad",
  curriculum: "Currículum",
  contrato: "Contrato",
  anexo_contrato: "Anexo de contrato",
};

type UploadedDoc = {
  type: string;
  fileUrl: string;
};

interface PostulacionPublicFormProps {
  token: string;
}

export function PostulacionPublicForm({ token }: PostulacionPublicFormProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [docType, setDocType] = useState("cedula_identidad");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    email: "",
    phoneMobile: "",
    addressFormatted: "",
    commune: "",
    city: "",
    region: "",
  });

  const docsByType = useMemo(() => {
    const map = new Map<string, UploadedDoc>();
    for (const doc of uploadedDocs) {
      if (!map.has(doc.type)) map.set(doc.type, doc);
    }
    return Array.from(map.values());
  }, [uploadedDocs]);

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("token", token);
      body.append("file", file);
      const response = await fetch("/api/public/postulacion/upload", {
        method: "POST",
        body,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo subir el archivo");
      }
      setUploadedDocs((prev) => [{ type: docType, fileUrl: payload.data.url }, ...prev.filter((d) => d.type !== docType)]);
      toast.success("Documento subido");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (type: string) => {
    setUploadedDocs((prev) => prev.filter((doc) => doc.type !== type));
  };

  const handleSubmit = async () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.rut.trim() ||
      !form.email.trim() ||
      !form.phoneMobile.trim() ||
      !form.addressFormatted.trim()
    ) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/public/postulacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          rut: normalizeRut(form.rut),
          email: form.email.trim(),
          phoneMobile: normalizeMobileNineDigits(form.phoneMobile),
          addressFormatted: form.addressFormatted.trim(),
          commune: form.commune.trim() || null,
          city: form.city.trim() || null,
          region: form.region.trim() || null,
          documents: docsByType,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo enviar la postulación");
      }
      toast.success("Postulación enviada correctamente");
      setForm({
        firstName: "",
        lastName: "",
        rut: "",
        email: "",
        phoneMobile: "",
        addressFormatted: "",
        commune: "",
        city: "",
        region: "",
      });
      setUploadedDocs([]);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo enviar la postulación");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Formulario de postulación</CardTitle>
          <p className="text-sm text-muted-foreground">
            Completa tus datos y sube tus documentos para que el equipo de operaciones revise tu postulación.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Nombre *"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            />
            <Input
              placeholder="Apellido *"
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            />
            <Input
              placeholder="RUT * (sin puntos y con guión)"
              value={form.rut}
              onChange={(e) => setForm((prev) => ({ ...prev, rut: normalizeRut(e.target.value) }))}
            />
            <Input
              placeholder="Email *"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Celular * (9 dígitos)"
              value={form.phoneMobile}
              maxLength={9}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phoneMobile: normalizeMobileNineDigits(e.target.value).slice(0, 9),
                }))
              }
            />
            <Input
              placeholder="Dirección *"
              value={form.addressFormatted}
              onChange={(e) => setForm((prev) => ({ ...prev, addressFormatted: e.target.value }))}
            />
            <Input
              placeholder="Comuna"
              value={form.commune}
              onChange={(e) => setForm((prev) => ({ ...prev, commune: e.target.value }))}
            />
            <Input
              placeholder="Ciudad"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
            <Input
              placeholder="Región"
              value={form.region}
              onChange={(e) => setForm((prev) => ({ ...prev, region: e.target.value }))}
            />
          </div>

          <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-3">
            <p className="text-sm font-medium">Documentos</p>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DOC_LABEL[type] || type}
                  </option>
                ))}
              </select>
              <label className="inline-flex">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,image/*"
                  onChange={(e) => void handleUpload(e.target.files?.[0])}
                  disabled={uploading}
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading}>
                  <FilePlus2 className="h-4 w-4 mr-1" />
                  {uploading ? "Subiendo..." : "Subir"}
                </Button>
              </label>
            </div>
            {docsByType.length > 0 ? (
              <div className="space-y-2">
                {docsByType.map((doc) => (
                  <div key={doc.type} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span className="text-sm">{DOC_LABEL[doc.type] || doc.type}</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Ver
                      </a>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDoc(doc.type)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Puedes subir cédula, antecedentes, OS-10, currículum, contrato y anexos.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={saving}>
              <Upload className="h-4 w-4 mr-1" />
              {saving ? "Enviando..." : "Enviar postulación"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
