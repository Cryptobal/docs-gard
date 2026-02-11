"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, StatusBadge } from "@/components/opai";
import { CalendarCheck2, RefreshCw } from "lucide-react";

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
  };
};

type AsistenciaItem = {
  id: string;
  date: string;
  attendanceStatus: string;
  plannedGuardiaId?: string | null;
  actualGuardiaId?: string | null;
  replacementGuardiaId?: string | null;
  puesto: {
    id: string;
    name: string;
    shiftStart: string;
    shiftEnd: string;
    teMontoClp?: string | number | null;
  };
  plannedGuardia?: {
    id: string;
    code?: string | null;
    persona: { firstName: string; lastName: string };
  } | null;
  actualGuardia?: {
    id: string;
    code?: string | null;
    persona: { firstName: string; lastName: string };
  } | null;
  replacementGuardia?: {
    id: string;
    code?: string | null;
    persona: { firstName: string; lastName: string };
  } | null;
  turnosExtra?: Array<{
    id: string;
    status: string;
    amountClp: string | number;
  }>;
};

interface OpsPautaDiariaClientProps {
  installations: InstallationOption[];
  guardias: GuardiaOption[];
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function OpsPautaDiariaClient({
  installations,
  guardias,
}: OpsPautaDiariaClientProps) {
  const [installationId, setInstallationId] = useState<string>(installations[0]?.id ?? "");
  const [date, setDate] = useState<string>(toDateInput(new Date()));
  const [loading, setLoading] = useState<boolean>(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [items, setItems] = useState<AsistenciaItem[]>([]);

  const fetchAsistencia = async () => {
    if (!installationId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/ops/asistencia?installationId=${installationId}&date=${date}`,
        { cache: "no-store" }
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Error cargando asistencia");
      }
      setItems(payload.data.items as AsistenciaItem[]);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar la pauta diaria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAsistencia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationId, date]);

  const patchAsistencia = async (
    id: string,
    payload: Record<string, unknown>,
    successMessage?: string
  ) => {
    setSavingId(id);
    try {
      const response = await fetch(`/api/ops/asistencia/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error actualizando asistencia");
      }
      setItems((prev) => prev.map((row) => (row.id === id ? (data.data as AsistenciaItem) : row)));
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar la asistencia");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5 md:col-span-2">
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
              <label className="text-xs text-muted-foreground">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => void fetchAsistencia()} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recargar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {items.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck2 className="h-8 w-8" />}
              title="Sin pauta diaria"
              description="Primero genera pauta mensual para esta instalación y fecha."
              compact
            />
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const replacementValue = item.replacementGuardiaId ?? "";
                const te = item.turnosExtra?.[0];
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border p-3 sm:p-4 space-y-3"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.puesto.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.puesto.shiftStart} - {item.puesto.shiftEnd}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.attendanceStatus} />
                        {te && (
                          <span className="text-[11px] text-amber-400">
                            TE {te.status} (${Number(te.amountClp).toLocaleString("es-CL")})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-md border border-border/60 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Guardia planificado</p>
                        <p className="text-sm">
                          {item.plannedGuardia
                            ? `${item.plannedGuardia.persona.firstName} ${item.plannedGuardia.persona.lastName}`
                            : "Sin asignar"}
                        </p>
                      </div>
                      <div className="rounded-md border border-border/60 p-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Reemplazo</p>
                        <select
                          className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                          value={replacementValue}
                          onChange={(e) =>
                            void patchAsistencia(
                              item.id,
                              {
                                replacementGuardiaId: e.target.value || null,
                                attendanceStatus: e.target.value ? "reemplazo" : "pendiente",
                              },
                              "Asistencia actualizada"
                            )
                          }
                          disabled={savingId === item.id}
                        >
                          <option value="">Sin reemplazo</option>
                          {guardias.map((guardia) => (
                            <option key={guardia.id} value={guardia.id}>
                              {guardia.persona.firstName} {guardia.persona.lastName}
                              {guardia.code ? ` (${guardia.code})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingId === item.id}
                        onClick={() =>
                          void patchAsistencia(
                            item.id,
                            {
                              attendanceStatus: "asistio",
                              actualGuardiaId:
                                item.replacementGuardiaId ?? item.actualGuardiaId ?? item.plannedGuardiaId ?? null,
                            },
                            "Asistencia marcada"
                          )
                        }
                      >
                        Asistió
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingId === item.id}
                        onClick={() =>
                          void patchAsistencia(
                            item.id,
                            { attendanceStatus: "no_asistio", actualGuardiaId: null },
                            "Marcado como no asistió"
                          )
                        }
                      >
                        No asistió
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={savingId === item.id}
                        onClick={() =>
                          void patchAsistencia(
                            item.id,
                            {
                              attendanceStatus: "ppc",
                              actualGuardiaId: null,
                              replacementGuardiaId: null,
                            },
                            "Marcado como PPC"
                          )
                        }
                      >
                        PPC
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
