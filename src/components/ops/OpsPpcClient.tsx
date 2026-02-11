"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/opai";
import { AlertTriangle } from "lucide-react";

type InstallationOption = {
  id: string;
  name: string;
};

type PpcItem = {
  id: string;
  attendanceStatus: string;
  installation: { id: string; name: string };
  puesto: { id: string; name: string; shiftStart: string; shiftEnd: string };
  plannedGuardia?: {
    id: string;
    code?: string | null;
    persona: { firstName: string; lastName: string };
  } | null;
};

interface OpsPpcClientProps {
  installations: InstallationOption[];
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function OpsPpcClient({ installations }: OpsPpcClientProps) {
  const [installationId, setInstallationId] = useState<string>("all");
  const [date, setDate] = useState<string>(toDateInput(new Date()));
  const [items, setItems] = useState<PpcItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPpc = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (installationId !== "all") params.set("installationId", installationId);
      const response = await fetch(`/api/ops/ppc?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Error cargando PPC");
      }
      setItems(payload.data.items as PpcItem[]);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo cargar PPC");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPpc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationId, date]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Instalación</label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={installationId}
                onChange={(e) => setInstallationId(e.target.value)}
              >
                <option value="all">Todas</option>
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
            <div className="flex items-end text-xs text-muted-foreground">
              {loading ? "Cargando..." : `${items.length} puesto(s) por cubrir`}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          {items.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8" />}
              title="Sin PPC"
              description="No hay puestos por cubrir para los filtros actuales."
              compact
            />
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{item.puesto.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.installation.name} · {item.puesto.shiftStart} - {item.puesto.shiftEnd}
                  </p>
                  <p className="mt-1 text-xs text-amber-400">
                    Estado: {item.attendanceStatus}
                    {item.plannedGuardia
                      ? ` · Planificado: ${item.plannedGuardia.persona.firstName} ${item.plannedGuardia.persona.lastName}`
                      : " · Sin guardia planificado"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
