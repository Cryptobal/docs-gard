"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SignatureUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function SignatureUpload({ value, onChange }: SignatureUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/docs/sign/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Error al subir firma");
        return;
      }
      onChange(data.data.url);
    } catch {
      setError("Error al subir firma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Subir imagen de firma (PNG/JPG)</label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="block w-full text-sm"
        onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)}
      />
      {loading ? <div className="text-xs text-muted-foreground">Subiendo...</div> : null}
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
      {value ? (
        <div className="space-y-2">
          <img src={value} alt="Firma subida" className="h-28 rounded border bg-white p-1" />
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)}>
            Quitar firma
          </Button>
        </div>
      ) : null}
    </div>
  );
}
