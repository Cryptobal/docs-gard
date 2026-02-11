"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/opai";
import { CalendarDays, RefreshCw } from "lucide-react";

type InstallationOption = {
  id: string;
  name: string;
};

type GuardiaOption = {
  id: string;
  code?: string | null;
  persona: {
    firstName: string;
    lastName: string;
    rut?: string | null;
  };
};

type PautaItem = {
  id: string;
  puestoId: string;
  date: string;
  status: string;
  plannedGuardiaId?: string | null;
  puesto: {
    id: string;
    name: string;
    shiftStart: string;
    shiftEnd: string;
    weekdays?: string[];
  };
  plannedGuardia?: {
    id: string;
    code?: string | null;
    persona: {
      firstName: string;
      lastName: string;
      rut?: string | null;
    };
  } | null;
};

interface OpsPautaMensualClientProps {
  installations: InstallationOption[];
  guardias: GuardiaOption[];
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export function OpsPautaMensualClient({
  installations,
  guardias,
}: OpsPautaMensualClientProps) {
  const today = new Date();
  const [installationId, setInstallationId] = useState<string>(installations[0]?.id ?? "");
  const [month, setMonth] = useState<number>(today.getUTCMonth() + 1);
  const [year, setYear] = useState<number>(today.getUTCFullYear());
  const [overwrite, setOverwrite] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [items, setItems] = useState<PautaItem[]>([]);

  const fetchPauta = async () => {
    if (!installationId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ops/pauta-mensual?installationId=${installationId}&month=${month}&year=${year}`,
        { cache: "no-store" }
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Error cargando pauta");
      }
      setItems(payload.data.items as PautaItem[]);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar la pauta mensual");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPauta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationId, month, year]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, PautaItem[]>();
    for (const item of items) {
      const key = toDateInput(new Date(item.date));
      const existing = map.get(key);
      if (existing) existing.push(item);
      else map.set(key, [item]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const handleGenerate = async () => {
    if (!installationId) {
      toast.error("Selecciona una instalación");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/ops/pauta-mensual/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installationId,
          month,
          year,
          overwrite,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Error generando pauta");
      }
      toast.success(`Pauta generada (${payload.data.created} filas)`);
      await fetchPauta();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar la pauta mensual");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignGuardia = async (item: PautaItem, guardiaId: string) => {
    setSavingRow(item.id);
    try {
      const response = await fetch("/api/ops/pauta-mensual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puestoId: item.puestoId,
          date: toDateInput(new Date(item.date)),
          plannedGuardiaId: guardiaId || null,
          status: "planificado",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Error guardando asignación");
      }
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                plannedGuardiaId: guardiaId || null,
                plannedGuardia: guardiaId
                  ? {
                      id: guardiaId,
                      code: guardias.find((g) => g.id === guardiaId)?.code ?? null,
                      persona: guardias.find((g) => g.id === guardiaId)!.persona,
                    }
                  : null,
              }
            : row
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar asignación");
    } finally {
      setSavingRow(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Instalación</label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={installationId}
                onChange={(e) => setInstallationId(e.target.value)}
              >
                {installations.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Mes</label>
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value) || month)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Año</label>
              <input
                type="number"
                min={2020}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || year)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => void fetchPauta()} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recargar
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
              Sobrescribir planificación existente
            </label>
            <Button onClick={handleGenerate} disabled={loading}>
              <CalendarDays className="mr-2 h-4 w-4" />
              {loading ? "Generando..." : "Generar pauta"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {groupedByDate.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8" />}
              title="Sin pauta mensual"
              description="Genera la pauta para comenzar asignaciones."
              compact
            />
          ) : (
            <div className="space-y-4">
              {groupedByDate.map(([date, rows]) => (
                <div key={date} className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatDate(date)}
                  </p>
                  <div className="space-y-2">
                    {rows.map((row) => {
                      const currentValue = row.plannedGuardiaId ?? "";
                      return (
                        <div
                          key={row.id}
                          className="rounded-md border border-border/60 bg-card px-3 py-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">{row.puesto.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {row.puesto.shiftStart} - {row.puesto.shiftEnd}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              value={currentValue}
                              onChange={(e) => void handleAssignGuardia(row, e.target.value)}
                              disabled={savingRow === row.id}
                            >
                              <option value="">Sin asignar</option>
                              {guardias.map((guardia) => (
                                <option key={guardia.id} value={guardia.id}>
                                  {guardia.persona.firstName} {guardia.persona.lastName}
                                  {guardia.code ? ` (${guardia.code})` : ""}
                                </option>
                              ))}
                            </select>
                            {savingRow === row.id && (
                              <span className="text-[11px] text-muted-foreground">Guardando...</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
