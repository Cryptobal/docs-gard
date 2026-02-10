"use client";

import { Button } from "@/components/ui/button";

export type SignatureMethodOption = "typed" | "drawn" | "uploaded";

interface SignatureMethodSelectorProps {
  value: SignatureMethodOption;
  onChange: (method: SignatureMethodOption) => void;
}

export function SignatureMethodSelector({ value, onChange }: SignatureMethodSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        type="button"
        variant={value === "typed" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("typed")}
      >
        Escribir nombre
      </Button>
      <Button
        type="button"
        variant={value === "drawn" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("drawn")}
      >
        Dibujar firma
      </Button>
      <Button
        type="button"
        variant={value === "uploaded" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("uploaded")}
      >
        Subir imagen
      </Button>
    </div>
  );
}
