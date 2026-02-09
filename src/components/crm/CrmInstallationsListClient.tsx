"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Trash2, Search, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/opai/EmptyState";
import { CrmDates } from "@/components/crm/CrmDates";

export type InstallationRow = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  commune?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  account?: { id: string; name: string } | null;
};

export function CrmInstallationsListClient({
  initialInstallations,
}: {
  initialInstallations: InstallationRow[];
}) {
  const [installations, setInstallations] = useState<InstallationRow[]>(initialInstallations);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  const filteredInstallations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return installations.filter((inst) => {
      if (accountFilter !== "all" && inst.account?.id !== accountFilter) return false;
      if (q) {
        const searchable = `${inst.name} ${inst.address || ""} ${inst.city || ""} ${inst.commune || ""} ${inst.account?.name || ""}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [installations, search, accountFilter]);

  // Get unique accounts for filter pills
  const accountsWithInstallations = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    installations.forEach((inst) => {
      if (inst.account) {
        const existing = map.get(inst.account.id);
        if (existing) {
          existing.count++;
        } else {
          map.set(inst.account.id, { id: inst.account.id, name: inst.account.name, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [installations]);

  const deleteInstallation = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/installations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInstallations((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirm({ open: false, id: "" });
      toast.success("Instalación eliminada");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Search + Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, dirección o cuenta..."
            className="pl-9 h-9 bg-background text-foreground border-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              type="button"
              onClick={() => setAccountFilter("all")}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 ${
                accountFilter === "all"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              Todas ({installations.length})
            </button>
            {accountsWithInstallations.slice(0, 5).map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => setAccountFilter(acc.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 ${
                  accountFilter === acc.id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {acc.name} ({acc.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Installation list ── */}
      <Card>
        <CardContent className="pt-5">
          {filteredInstallations.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-8 w-8" />}
              title="Sin instalaciones"
              description={
                search || accountFilter !== "all"
                  ? "No hay instalaciones para los filtros seleccionados."
                  : "No hay instalaciones registradas. Crea instalaciones desde el detalle de una cuenta."
              }
              compact
            />
          ) : (
            <div className="space-y-2">
              {filteredInstallations.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
                >
                  <Link
                    href={`/crm/installations/${inst.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{inst.name}</p>
                    </div>
                    {inst.account && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {inst.account.name}
                      </p>
                    )}
                    {inst.address && (
                      <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {inst.address}
                        {(inst.city || inst.commune) && (
                          <span> · {[inst.commune, inst.city].filter(Boolean).join(", ")}</span>
                        )}
                      </p>
                    )}
                    {inst.createdAt && (
                      <CrmDates
                        createdAt={inst.createdAt}
                        updatedAt={inst.updatedAt}
                        className="mt-0.5"
                      />
                    )}
                  </Link>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm({ open: true, id: inst.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 hidden sm:block" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(v) => setDeleteConfirm({ ...deleteConfirm, open: v })}
        title="Eliminar instalación"
        description="La instalación será eliminada permanentemente. Esta acción no se puede deshacer."
        onConfirm={() => deleteInstallation(deleteConfirm.id)}
      />
    </div>
  );
}
