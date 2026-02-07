/**
 * Modal para crear cotización CPQ
 */

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface CreateQuoteModalProps {
  onCreated?: () => void;
}

export function CreateQuoteModal({ onCreated }: CreateQuoteModalProps) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cpq/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, validUntil, notes }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error");
      setOpen(false);
      setClientName("");
      setValidUntil("");
      setNotes("");
      onCreated?.();
    } catch (err) {
      console.error("Error creating CPQ quote:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cotización
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Cotización</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[10px]">Cliente</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre cliente"
              className="h-8 bg-background text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Válida hasta</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="h-8 bg-background text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Notas</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones"
              className="h-8 bg-background text-sm"
            />
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
