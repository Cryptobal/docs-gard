"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Building2, ExternalLink, Trash2, ArrowLeft, Info } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/opai/EmptyState";
import { toast } from "sonner";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export type InstallationDetail = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  commune?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  account?: { id: string; name: string } | null;
};

type Tab = "info" | "map";

export function CrmInstallationDetailClient({
  installation,
}: {
  installation: InstallationDetail;
}) {
  const router = useRouter();
  const hasCoords = installation.lat != null && installation.lng != null;
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const deleteInstallation = async () => {
    try {
      const res = await fetch(`/api/crm/installations/${installation.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Instalación eliminada");
      router.push("/crm/installations");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "Información" },
    { key: "map", label: "Mapa" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Detail toolbar: Back + Actions ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/installations"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a instalaciones
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* ── Tab pills ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors shrink-0 ${
              activeTab === tab.key
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Info Tab ── */}
      {activeTab === "info" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                Datos generales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Dirección">
                {installation.address ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {installation.address}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin dirección</span>
                )}
              </InfoRow>
              <InfoRow label="Comuna / Ciudad">
                {(installation.commune || installation.city)
                  ? [installation.commune, installation.city].filter(Boolean).join(", ")
                  : "—"}
              </InfoRow>
              {installation.notes && (
                <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground mt-2">
                  {installation.notes}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {installation.account ? (
                <Link
                  href={`/crm/accounts/${installation.account.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">{installation.account.name}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </Link>
              ) : (
                <EmptyState
                  icon={<Building2 className="h-8 w-8" />}
                  title="Sin cuenta"
                  description="Esta instalación no está vinculada a una cuenta."
                  compact
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Map Tab ── */}
      {activeTab === "map" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasCoords && MAPS_KEY ? (
              <a
                href={`https://www.google.com/maps/@${installation.lat},${installation.lng},17z`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-border hover:opacity-95 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=${installation.lat},${installation.lng}&zoom=16&size=800x320&scale=2&markers=color:red%7C${installation.lat},${installation.lng}&key=${MAPS_KEY}`}
                  alt={`Mapa de ${installation.name}`}
                  className="w-full h-auto min-h-[200px] object-cover"
                />
                <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                  Abrir en Google Maps
                </div>
              </a>
            ) : (
              <EmptyState
                icon={<MapPin className="h-8 w-8" />}
                title="Sin ubicación"
                description={
                  hasCoords && !MAPS_KEY
                    ? `Coordenadas: ${installation.lat}, ${installation.lng}. Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para ver el mapa.`
                    : "Edita la instalación y selecciona una dirección para ver el mapa."
                }
                compact
              />
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Eliminar instalación"
        description="La instalación será eliminada permanentemente. Esta acción no se puede deshacer."
        onConfirm={deleteInstallation}
      />
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
