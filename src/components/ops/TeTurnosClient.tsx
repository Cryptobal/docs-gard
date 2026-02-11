"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, StatusBadge } from "@/components/opai";
import { Clock3, Search } from "lucide-react";

type TeItem = {
  id: string;
  date: string;
  status: string;
  amountClp: number | string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  paidAt?: string | null;
  installation?: { id: string; name: string } | null;
  puesto?: { id: string; name: string } | null;
  guardia: {
    id: string;
    code?: string | null;
    persona: {
      firstName: string;
      lastName: string;
      rut?: string | null;
    };
  };
};

interface TeTurnosClientProps {
  initialItems: TeItem[];
  defaultStatusFilter?: string;
}

function toNumber(value: number | string): number {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateLabel(value: string): string {
  return new Date(value).toLocaleDateString("es-CL");
}

export function TeTurnosClient({
  initialItems,
  defaultStatusFilter = "all",
}: TeTurnosClientProps) {
  const [items, setItems] = useState<TeItem[]>(initialItems);
  const [statusFilter, setStatusFilter] = useState<string>(defaultStatusFilter);
  const [search, setSearch] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (query) {
        const haystack =
          `${item.installation?.name ?? ""} ${item.puesto?.name ?? ""} ${item.guardia.persona.firstName} ${item.guardia.persona.lastName} ${item.guardia.persona.rut ?? ""}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [items, search, statusFilter]);

  const patch = async (id: string, action: "aprobar" | "rechazar", reason?: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/te/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: action === "rechazar" ? JSON.stringify({ reason: reason ?? null }) : undefined,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Error actualizando turno extra");
      }
      setItems((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                status: payload.data.status,
                approvedAt: payload.data.approvedAt,
                rejectedAt: payload.data.rejectedAt,
                paidAt: payload.data.paidAt,
              }
            : row
        )
      );
      toast.success(action === "aprobar" ? "Turno aprobado" : "Turno rechazado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el turno");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por instalación, puesto, guardia o RUT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
              <option value="paid">Pagados</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Clock3 className="h-8 w-8" />}
              title="Sin turnos extra"
              description="No hay registros para los filtros seleccionados."
              compact
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border p-3 sm:p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {item.guardia.persona.firstName} {item.guardia.persona.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.installation?.name ?? "Instalación"} · {item.puesto?.name ?? "Sin puesto"} ·{" "}
                      {toDateLabel(item.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Monto: ${toNumber(item.amountClp).toLocaleString("es-CL")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === item.id}
                          onClick={() => void patch(item.id, "aprobar")}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={updatingId === item.id}
                          onClick={() => {
                            const reason = window.prompt("Motivo de rechazo (opcional):") ?? "";
                            void patch(item.id, "rechazar", reason || undefined);
                          }}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
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
