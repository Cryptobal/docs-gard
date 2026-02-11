"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, StatusBadge } from "@/components/opai";
import { ShieldUser } from "lucide-react";

type GuardiaItem = {
  id: string;
  code?: string | null;
  status: string;
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  persona: {
    firstName: string;
    lastName: string;
    rut?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

interface GuardiasClientProps {
  initialGuardias: GuardiaItem[];
}

export function GuardiasClient({ initialGuardias }: GuardiasClientProps) {
  const [guardias, setGuardias] = useState<GuardiaItem[]>(initialGuardias);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    rut: "",
    email: "",
    phone: "",
    code: "",
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return guardias;
    return guardias.filter((item) => {
      const text =
        `${item.persona.firstName} ${item.persona.lastName} ${item.persona.rut ?? ""} ${item.persona.email ?? ""} ${item.code ?? ""}`.toLowerCase();
      return text.includes(query);
    });
  }, [guardias, search]);

  const handleCreate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Nombre y apellido son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/personas/guardias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          rut: form.rut || null,
          email: form.email || null,
          phone: form.phone || null,
          code: form.code || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo crear guardia");
      }
      setGuardias((prev) => [payload.data as GuardiaItem, ...prev]);
      setForm({
        firstName: "",
        lastName: "",
        rut: "",
        email: "",
        phone: "",
        code: "",
      });
      toast.success("Guardia creado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear guardia");
    } finally {
      setSaving(false);
    }
  };

  const handleBlacklistToggle = async (item: GuardiaItem) => {
    const isBlacklisted = !item.isBlacklisted;
    const reason = isBlacklisted
      ? window.prompt("Motivo de lista negra:", item.blacklistReason ?? "") ?? ""
      : null;

    setUpdatingId(item.id);
    try {
      const response = await fetch(`/api/personas/guardias/${item.id}/lista-negra`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBlacklisted,
          reason,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo actualizar lista negra");
      }
      setGuardias((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                isBlacklisted: payload.data.isBlacklisted,
                blacklistReason: payload.data.blacklistReason,
              }
            : row
        )
      );
      toast.success(isBlacklisted ? "Guardia enviado a lista negra" : "Guardia removido de lista negra");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar lista negra");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="Nombre"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            />
            <Input
              placeholder="Apellido"
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            />
            <Input
              placeholder="Código interno"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="RUT"
              value={form.rut}
              onChange={(e) => setForm((prev) => ({ ...prev, rut: e.target.value }))}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Teléfono"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Guardando..." : "Agregar guardia"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <Input
            placeholder="Buscar por nombre, RUT, email o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={<ShieldUser className="h-8 w-8" />}
              title="Sin guardias"
              description="Agrega guardias para habilitar asignación en pauta."
              compact
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-3 sm:p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.persona.firstName} {item.persona.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.persona.rut || "Sin RUT"}
                      {item.code ? ` · ${item.code}` : ""}
                      {item.persona.phone ? ` · ${item.persona.phone}` : ""}
                    </p>
                    {item.blacklistReason && (
                      <p className="text-xs text-red-400 mt-1">Motivo: {item.blacklistReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.isBlacklisted ? (
                      <span className="text-[11px] rounded-full bg-red-500/15 px-2 py-1 text-red-400">
                        Lista negra
                      </span>
                    ) : null}
                    <Button
                      size="sm"
                      variant={item.isBlacklisted ? "outline" : "ghost"}
                      disabled={updatingId === item.id}
                      onClick={() => void handleBlacklistToggle(item)}
                    >
                      {item.isBlacklisted ? "Quitar lista negra" : "Lista negra"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
