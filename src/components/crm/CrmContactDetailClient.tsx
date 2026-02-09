"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/opai/EmptyState";
import {
  ArrowLeft,
  Users,
  Building2,
  TrendingUp,
  Mail,
  Phone,
  Briefcase,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type DealRow = {
  id: string;
  title: string;
  amount: string;
  status: string;
  stage?: { name: string } | null;
};

type ContactDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  isPrimary?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  account?: {
    id: string;
    name: string;
    type?: string;
    industry?: string | null;
  } | null;
};

type Tab = "info" | "deals";

export function CrmContactDetailClient({
  contact: initialContact,
  deals,
}: {
  contact: ContactDetail;
  deals: DealRow[];
}) {
  const router = useRouter();
  const [contact, setContact] = useState(initialContact);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email || "",
    phone: contact.phone || "",
    roleTitle: contact.roleTitle || "",
    isPrimary: contact.isPrimary || false,
  });

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const inputCn = "bg-background text-foreground placeholder:text-muted-foreground border-input focus-visible:ring-ring";

  const deleteContact = async () => {
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Contacto eliminado");
      router.push("/crm/contacts");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone || null,
          roleTitle: editForm.roleTitle || null,
          isPrimary: editForm.isPrimary,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error);
      setContact((prev) => ({ ...prev, ...editForm }));
      setEditOpen(false);
      toast.success("Contacto actualizado");
    } catch {
      toast.error("No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "info", label: "Información" },
    { key: "deals", label: "Negocios", count: deals.length },
  ];

  return (
    <div className="space-y-4">
      {/* ── Detail toolbar: Back + Actions ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/contacts"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a contactos
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditForm({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email || "",
                phone: contact.phone || "",
                roleTitle: contact.roleTitle || "",
                isPrimary: contact.isPrimary || false,
              });
              setEditOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
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
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Info Tab ── */}
      {activeTab === "info" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Datos del contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Nombre completo">
                <span className="font-medium">{fullName}</span>
              </InfoRow>
              <InfoRow label="Email">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-primary hover:underline">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Sin email</span>
                )}
              </InfoRow>
              <InfoRow label="Teléfono">
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Sin teléfono</span>
                )}
              </InfoRow>
              <InfoRow label="Cargo">
                {contact.roleTitle ? (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {contact.roleTitle}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin cargo</span>
                )}
              </InfoRow>
              <InfoRow label="Tipo">
                {contact.isPrimary ? (
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    Principal
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Secundario</span>
                )}
              </InfoRow>
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
              {contact.account ? (
                <Link
                  href={`/crm/accounts/${contact.account.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <p className="font-medium text-sm">{contact.account.name}</p>
                      {contact.account.type && (
                        <Badge
                          variant="outline"
                          className={
                            contact.account.type === "client"
                              ? "border-emerald-500/30 text-emerald-400"
                              : "border-amber-500/30 text-amber-400"
                          }
                        >
                          {contact.account.type === "client" ? "Cliente" : "Prospecto"}
                        </Badge>
                      )}
                    </div>
                    {contact.account.industry && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{contact.account.industry}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </Link>
              ) : (
                <EmptyState
                  icon={<Building2 className="h-8 w-8" />}
                  title="Sin cuenta"
                  description="Este contacto no está asociado a una cuenta."
                  compact
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Deals Tab ── */}
      {activeTab === "deals" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Negocios de la cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-8 w-8" />}
                title="Sin negocios"
                description="No hay negocios vinculados a la cuenta de este contacto."
                compact
              />
            ) : (
              <div className="space-y-2">
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/crm/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{deal.title}</p>
                        <Badge variant="outline">{deal.stage?.name}</Badge>
                        {deal.status === "won" && (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                            Ganado
                          </Badge>
                        )}
                        {deal.status === "lost" && (
                          <Badge variant="outline" className="border-red-500/30 text-red-400">
                            Perdido
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        ${Number(deal.amount).toLocaleString("es-CL")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 shrink-0 hidden sm:block" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Edit Modal ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre *</Label>
              <Input value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} className={inputCn} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Apellido *</Label>
              <Input value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} className={inputCn} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className={inputCn} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className={inputCn} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cargo</Label>
              <Input value={editForm.roleTitle} onChange={(e) => setEditForm((p) => ({ ...p, roleTitle: e.target.value }))} className={inputCn} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editForm.isPrimary} onChange={(e) => setEditForm((p) => ({ ...p, isPrimary: e.target.checked }))} />
                Principal
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Eliminar contacto"
        description="El contacto será eliminado permanentemente. Esta acción no se puede deshacer."
        onConfirm={deleteContact}
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
