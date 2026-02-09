"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/opai/EmptyState";
import {
  Building2,
  Users,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
} from "lucide-react";

type ContactRow = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  isPrimary?: boolean;
};

type DealRow = {
  id: string;
  title: string;
  amount: string;
  status: string;
  stage?: { name: string; color?: string | null } | null;
  primaryContact?: { name: string } | null;
};

type AccountDetail = {
  id: string;
  name: string;
  type: "prospect" | "client";
  status: string;
  rut?: string | null;
  industry?: string | null;
  segment?: string | null;
  size?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  contacts: ContactRow[];
  deals: DealRow[];
  _count: { contacts: number; deals: number };
};

type Tab = "info" | "contacts" | "deals";

export function CrmAccountDetailClient({ account }: { account: AccountDetail }) {
  const [activeTab, setActiveTab] = useState<Tab>("info");

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "info", label: "Información" },
    { key: "contacts", label: "Contactos", count: account._count.contacts },
    { key: "deals", label: "Negocios", count: account._count.deals },
  ];

  return (
    <div className="space-y-4">
      {/* Tab pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
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
                <Building2 className="h-4 w-4" />
                Datos generales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Tipo">
                <Badge
                  variant="outline"
                  className={
                    account.type === "client"
                      ? "border-emerald-500/30 text-emerald-400"
                      : "border-amber-500/30 text-amber-400"
                  }
                >
                  {account.type === "client" ? "Cliente" : "Prospecto"}
                </Badge>
              </InfoRow>
              <InfoRow label="RUT">{account.rut || "—"}</InfoRow>
              <InfoRow label="Industria">{account.industry || "—"}</InfoRow>
              <InfoRow label="Segmento">{account.segment || "—"}</InfoRow>
              <InfoRow label="Tamaño">{account.size || "—"}</InfoRow>
              <InfoRow label="Estado">
                <Badge variant="outline">{account.status}</Badge>
              </InfoRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {account.website && (
                <InfoRow label="Web">
                  <a
                    href={account.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {account.website}
                  </a>
                </InfoRow>
              )}
              {account.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{account.address}</span>
                </div>
              )}
              {account.notes && (
                <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  {account.notes}
                </div>
              )}
              {!account.website && !account.address && !account.notes && (
                <p className="text-muted-foreground text-xs">Sin información adicional.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === "contacts" && (
        <Card>
          <CardHeader>
            <CardTitle>Contactos</CardTitle>
          </CardHeader>
          <CardContent>
            {account.contacts.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="Sin contactos"
                description="Este cuenta no tiene contactos registrados."
                compact
              />
            ) : (
              <div className="space-y-3">
                {account.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{contact.name}</p>
                        {contact.isPrimary && (
                          <Badge variant="outline" className="text-[10px]">
                            Principal
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {contact.roleTitle || "Sin cargo"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Deals Tab ── */}
      {activeTab === "deals" && (
        <Card>
          <CardHeader>
            <CardTitle>Negocios</CardTitle>
          </CardHeader>
          <CardContent>
            {account.deals.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-8 w-8" />}
                title="Sin negocios"
                description="No hay negocios vinculados a esta cuenta."
                compact
              />
            ) : (
              <div className="space-y-3">
                {account.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/crm/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        ${Number(deal.amount).toLocaleString("es-CL")}
                        {deal.primaryContact ? ` · ${deal.primaryContact.name}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{deal.stage?.name}</Badge>
                      {deal.status === "won" && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          Ganado
                        </Badge>
                      )}
                      {deal.status === "lost" && (
                        <Badge className="bg-red-500/15 text-red-400 border-red-500/30">
                          Perdido
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
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
