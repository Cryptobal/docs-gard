"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete, type AddressResult } from "@/components/ui/AddressAutocomplete";
import { EmptyState, StatusBadge } from "@/components/opai";
import { ShieldUser } from "lucide-react";
import {
  BANK_ACCOUNT_TYPES,
  CHILE_BANKS,
  GUARDIA_LIFECYCLE_STATUSES,
  normalizeMobileNineDigits,
  normalizeRut,
} from "@/lib/personas";

type GuardiaItem = {
  id: string;
  code?: string | null;
  status: string;
  lifecycleStatus: string;
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  persona: {
    firstName: string;
    lastName: string;
    rut?: string | null;
    email?: string | null;
    phone?: string | null;
    phoneMobile?: string | null;
    addressFormatted?: string | null;
    city?: string | null;
    commune?: string | null;
  };
  bankAccounts?: Array<{
    id: string;
    bankName: string;
    accountType: string;
    accountNumber: string;
    isDefault: boolean;
  }>;
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
    phoneMobile: "",
    lifecycleStatus: "postulante",
    addressFormatted: "",
    googlePlaceId: "",
    commune: "",
    city: "",
    region: "",
    lat: "",
    lng: "",
    bankCode: "",
    accountType: "",
    accountNumber: "",
    holderName: "",
  });

  const LIFECYCLE_LABELS: Record<string, string> = {
    postulante: "Postulante",
    seleccionado: "Seleccionado",
    contratado_activo: "Contratado activo",
    inactivo: "Inactivo",
    desvinculado: "Desvinculado",
  };

  const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    cuenta_corriente: "Cuenta corriente",
    cuenta_vista: "Cuenta vista",
    cuenta_rut: "Cuenta RUT",
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return guardias;
    return guardias.filter((item) => {
      const text =
        `${item.persona.firstName} ${item.persona.lastName} ${item.persona.rut ?? ""} ${item.persona.email ?? ""} ${item.code ?? ""} ${item.persona.addressFormatted ?? ""}`.toLowerCase();
      return text.includes(query);
    });
  }, [guardias, search]);

  const onAddressChange = (result: AddressResult) => {
    setForm((prev) => ({
      ...prev,
      addressFormatted: result.address,
      googlePlaceId: result.placeId || "",
      commune: result.commune || "",
      city: result.city || "",
      region: result.region || "",
      lat: String(result.lat || ""),
      lng: String(result.lng || ""),
    }));
  };

  const handleCreate = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.rut.trim() || !form.email.trim() || !form.phoneMobile.trim()) {
      toast.error("Nombre, apellido, RUT, email y celular son obligatorios");
      return;
    }
    if (!form.googlePlaceId || !form.addressFormatted) {
      toast.error("Debes seleccionar la dirección desde Google Maps");
      return;
    }
    setSaving(true);
    try {
      const selectedBank = CHILE_BANKS.find((b) => b.code === form.bankCode);
      const response = await fetch("/api/personas/guardias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          rut: normalizeRut(form.rut),
          email: form.email.trim(),
          phoneMobile: normalizeMobileNineDigits(form.phoneMobile),
          lifecycleStatus: form.lifecycleStatus,
          addressFormatted: form.addressFormatted,
          googlePlaceId: form.googlePlaceId,
          commune: form.commune || null,
          city: form.city || null,
          region: form.region || null,
          lat: form.lat || null,
          lng: form.lng || null,
          bankCode: form.bankCode || null,
          bankName: selectedBank?.name ?? null,
          accountType: form.accountType || null,
          accountNumber: form.accountNumber || null,
          holderName: form.holderName || null,
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
        phoneMobile: "",
        lifecycleStatus: "postulante",
        addressFormatted: "",
        googlePlaceId: "",
        commune: "",
        city: "",
        region: "",
        lat: "",
        lng: "",
        bankCode: "",
        accountType: "",
        accountNumber: "",
        holderName: "",
      });
      toast.success("Guardia creado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear guardia");
    } finally {
      setSaving(false);
    }
  };

  const handleLifecycleChange = async (item: GuardiaItem, lifecycleStatus: string) => {
    setUpdatingId(item.id);
    try {
      const response = await fetch(`/api/personas/guardias/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifecycleStatus }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "No se pudo cambiar el estado laboral");
      }
      setGuardias((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                lifecycleStatus: payload.data.lifecycleStatus,
                status: payload.data.status,
              }
            : row
        )
      );
      toast.success("Estado laboral actualizado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar estado laboral");
    } finally {
      setUpdatingId(null);
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
              placeholder="Nombre *"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            />
            <Input
              placeholder="Apellido *"
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            />
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.lifecycleStatus}
              onChange={(e) => setForm((prev) => ({ ...prev, lifecycleStatus: e.target.value }))}
            >
              {GUARDIA_LIFECYCLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LIFECYCLE_LABELS[status] || status}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="RUT * (sin puntos y con guión)"
              value={form.rut}
              onChange={(e) => setForm((prev) => ({ ...prev, rut: normalizeRut(e.target.value) }))}
            />
            <Input
              placeholder="Email *"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              placeholder="Celular * (9 dígitos)"
              value={form.phoneMobile}
              maxLength={9}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  phoneMobile: normalizeMobileNineDigits(e.target.value).slice(0, 9),
                }))
              }
            />
          </div>
          <AddressAutocomplete
            value={form.addressFormatted}
            onChange={onAddressChange}
            placeholder="Dirección (Google Maps) *"
            showMap={false}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <Input placeholder="Comuna" value={form.commune} readOnly />
            <Input placeholder="Ciudad" value={form.city} readOnly />
            <Input placeholder="Región" value={form.region} readOnly />
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.bankCode}
              onChange={(e) => setForm((prev) => ({ ...prev, bankCode: e.target.value }))}
            >
              <option value="">Banco chileno (opcional)</option>
              {CHILE_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              value={form.accountType}
              onChange={(e) => setForm((prev) => ({ ...prev, accountType: e.target.value }))}
            >
              <option value="">Tipo de cuenta</option>
              {BANK_ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACCOUNT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <Input
              placeholder="Número de cuenta"
              value={form.accountNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
            />
            <Input
              placeholder="Titular cuenta"
              value={form.holderName}
              onChange={(e) => setForm((prev) => ({ ...prev, holderName: e.target.value }))}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Latitud" value={form.lat} readOnly />
            <Input placeholder="Longitud" value={form.lng} readOnly />
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
              description="Agrega guardias para habilitar asignación en pauta. Luego haz clic en «Ficha y documentos» para cargar antecedentes, OS-10, cédula, currículum y contratos de cada uno."
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
                      {item.code ? ` · Código ${item.code}` : ""}
                      {item.persona.phoneMobile ? ` · +56 ${item.persona.phoneMobile}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.persona.addressFormatted || "Sin dirección validada"}
                    </p>
                    {item.bankAccounts?.[0] ? (
                      <p className="text-xs text-muted-foreground">
                        {item.bankAccounts[0].bankName} · {ACCOUNT_TYPE_LABELS[item.bankAccounts[0].accountType] || item.bankAccounts[0].accountType}
                      </p>
                    ) : null}
                    {item.blacklistReason && (
                      <p className="text-xs text-red-400 mt-1">Motivo: {item.blacklistReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <select
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      value={item.lifecycleStatus}
                      disabled={updatingId === item.id}
                      onChange={(e) => void handleLifecycleChange(item, e.target.value)}
                    >
                      {GUARDIA_LIFECYCLE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {LIFECYCLE_LABELS[status] || status}
                        </option>
                      ))}
                    </select>
                    {item.isBlacklisted ? (
                      <span className="text-[11px] rounded-full bg-red-500/15 px-2 py-1 text-red-400">
                        Lista negra
                      </span>
                    ) : null}
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                    >
                      <Link href={`/personas/guardias/${item.id}`}>Ficha y documentos</Link>
                    </Button>
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
