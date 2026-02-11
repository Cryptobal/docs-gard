"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/opai";
import { Building2, Plus, Trash2 } from "lucide-react";

const WEEKDAYS = [
  { key: "monday", label: "Lun" },
  { key: "tuesday", label: "Mar" },
  { key: "wednesday", label: "Mié" },
  { key: "thursday", label: "Jue" },
  { key: "friday", label: "Vie" },
  { key: "saturday", label: "Sáb" },
  { key: "sunday", label: "Dom" },
] as const;

type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

type InstallationOption = {
  id: string;
  name: string;
  teMontoClp?: number | string | null;
};

type PuestoItem = {
  id: string;
  installationId: string;
  name: string;
  shiftStart: string;
  shiftEnd: string;
  weekdays: WeekdayKey[];
  requiredGuards: number;
  teMontoClp?: number | string | null;
  active: boolean;
  installation?: {
    id: string;
    name: string;
    teMontoClp?: number | string | null;
  } | null;
};

interface OpsPuestosClientProps {
  initialInstallations: InstallationOption[];
  initialPuestos: PuestoItem[];
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function OpsPuestosClient({
  initialInstallations,
  initialPuestos,
}: OpsPuestosClientProps) {
  const [puestos, setPuestos] = useState<PuestoItem[]>(initialPuestos);
  const [installationFilter, setInstallationFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    installationId: initialInstallations[0]?.id ?? "",
    name: "",
    shiftStart: "08:00",
    shiftEnd: "20:00",
    requiredGuards: 1,
    teMontoClp: "",
    weekdays: ["monday", "tuesday", "wednesday", "thursday", "friday"] as WeekdayKey[],
  });

  const filtered = useMemo(() => {
    if (installationFilter === "all") return puestos;
    return puestos.filter((item) => item.installationId === installationFilter);
  }, [puestos, installationFilter]);

  const handleToggleWeekday = (day: WeekdayKey) => {
    setForm((prev) => {
      if (prev.weekdays.includes(day)) {
        const next = prev.weekdays.filter((d) => d !== day);
        return { ...prev, weekdays: next.length > 0 ? next : prev.weekdays };
      }
      return { ...prev, weekdays: [...prev.weekdays, day] };
    });
  };

  const handleCreate = async () => {
    if (!form.installationId || !form.name.trim()) {
      toast.error("Selecciona instalación y nombre del puesto");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/ops/puestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installationId: form.installationId,
          name: form.name.trim(),
          shiftStart: form.shiftStart,
          shiftEnd: form.shiftEnd,
          weekdays: form.weekdays,
          requiredGuards: Number(form.requiredGuards),
          teMontoClp: form.teMontoClp ? Number(form.teMontoClp) : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo crear el puesto");
      }
      setPuestos((prev) => [payload.data as PuestoItem, ...prev]);
      setForm((prev) => ({
        ...prev,
        name: "",
        teMontoClp: "",
      }));
      toast.success("Puesto creado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear el puesto");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: PuestoItem) => {
    try {
      const response = await fetch(`/api/ops/puestos/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo actualizar");
      }
      setPuestos((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, active: !item.active } : row))
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el estado");
    }
  };

  const handleDelete = async (item: PuestoItem) => {
    if (!window.confirm(`¿Eliminar puesto "${item.name}"?`)) return;
    try {
      const response = await fetch(`/api/ops/puestos/${item.id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo eliminar");
      }
      setPuestos((prev) => prev.filter((row) => row.id !== item.id));
      toast.success("Puesto eliminado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el puesto");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Instalación</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.installationId}
                onChange={(e) => setForm((prev) => ({ ...prev, installationId: e.target.value }))}
              >
                {initialInstallations.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre puesto</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Portería 24x7"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Inicio</Label>
              <Input
                type="time"
                value={form.shiftStart}
                onChange={(e) => setForm((prev) => ({ ...prev, shiftStart: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Término</Label>
              <Input
                type="time"
                value={form.shiftEnd}
                onChange={(e) => setForm((prev) => ({ ...prev, shiftEnd: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dotación</Label>
              <Input
                type="number"
                min={1}
                value={form.requiredGuards}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, requiredGuards: Number(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Monto TE (CLP)</Label>
              <Input
                type="number"
                min={0}
                value={form.teMontoClp}
                onChange={(e) => setForm((prev) => ({ ...prev, teMontoClp: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Días de servicio</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const active = form.weekdays.includes(day.key);
                return (
                  <button
                    type="button"
                    key={day.key}
                    onClick={() => handleToggleWeekday(day.key)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      active
                        ? "border-primary/30 bg-primary/15 text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreate} disabled={saving}>
              <Plus className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Agregar puesto"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">Puestos operativos</h3>
              <p className="text-xs text-muted-foreground">
                Define estructura base para pauta mensual y generación de TE.
              </p>
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={installationFilter}
              onChange={(e) => setInstallationFilter(e.target.value)}
            >
              <option value="all">Todas las instalaciones</option>
              {initialInstallations.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-8 w-8" />}
              title="Sin puestos"
              description="Crea el primer puesto para comenzar a planificar."
              compact
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-3 sm:p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.installation?.name ?? "Instalación"} · {item.shiftStart} - {item.shiftEnd} ·{" "}
                      {item.requiredGuards} guardia(s)
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.weekdays.map((day) => {
                        const label = WEEKDAYS.find((opt) => opt.key === day)?.label ?? day;
                        return (
                          <Badge key={day} variant="outline" className="text-[10px]">
                            {label}
                          </Badge>
                        );
                      })}
                      <Badge variant="secondary" className="text-[10px]">
                        TE ${toNumber(item.teMontoClp).toLocaleString("es-CL")}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant={item.active ? "outline" : "secondary"}
                      onClick={() => handleToggleActive(item)}
                    >
                      {item.active ? "Activo" : "Inactivo"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
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
