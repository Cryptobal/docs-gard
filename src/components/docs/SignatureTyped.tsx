"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FONT_OPTIONS = [
  { key: "Dancing Script", label: "Manuscrita 1" },
  { key: "Pacifico", label: "Manuscrita 2" },
  { key: "Great Vibes", label: "Manuscrita 3" },
  { key: "Caveat", label: "Manuscrita 4" },
];

interface SignatureTypedProps {
  name: string;
  fontFamily: string;
  onNameChange: (name: string) => void;
  onFontChange: (font: string) => void;
}

export function SignatureTyped({
  name,
  fontFamily,
  onNameChange,
  onFontChange,
}: SignatureTypedProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="typedName">Nombre de firma</Label>
        <Input
          id="typedName"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Escribe tu nombre completo"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="typedFont">Estilo de firma</Label>
        <select
          id="typedFont"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={fontFamily}
          onChange={(e) => onFontChange(e.target.value)}
        >
          {FONT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border border-dashed border-primary/40 bg-muted/30 p-4">
        <div className="text-xs text-muted-foreground mb-2">Vista previa:</div>
        <div style={{ fontFamily, fontSize: "36px", lineHeight: 1.1 }} className="text-foreground">
          {name || "Tu firma aquí"}
        </div>
      </div>
    </div>
  );
}
