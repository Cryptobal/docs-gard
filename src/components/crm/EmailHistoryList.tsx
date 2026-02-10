"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/opai/EmptyState";
import {
  Mail,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertTriangle,
  Clock,
  Send,
  ArrowDownLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type EmailMessage = {
  id: string;
  direction: string;
  fromEmail: string;
  toEmails: string[];
  subject: string;
  status: string;
  sentAt?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  firstOpenedAt?: string | null;
  lastOpenedAt?: string | null;
  openCount: number;
  firstClickedAt?: string | null;
  clickCount: number;
  bouncedAt?: string | null;
  bounceType?: string | null;
  source: string;
  followUpLogId?: string | null;
  thread?: {
    dealId?: string | null;
    accountId?: string | null;
    contactId?: string | null;
    subject?: string;
  };
};

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Mail; className: string }
> = {
  queued: {
    label: "En cola",
    icon: Clock,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  sent: {
    label: "Enviado",
    icon: Send,
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  delivered: {
    label: "Entregado",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-600 border-green-200",
  },
  opened: {
    label: "Abierto",
    icon: Eye,
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  clicked: {
    label: "Clic",
    icon: MousePointerClick,
    className: "bg-purple-50 text-purple-600 border-purple-200",
  },
  bounced: {
    label: "Rebotado",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-600 border-red-200",
  },
  complained: {
    label: "Spam",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-700 border-red-300",
  },
};

function getEffectiveStatus(msg: EmailMessage): string {
  if (msg.bouncedAt) return "bounced";
  if (msg.clickCount > 0) return "clicked";
  if (msg.openCount > 0) return "opened";
  if (msg.deliveredAt) return "delivered";
  if (msg.sentAt) return "sent";
  return msg.status || "queued";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TrackingBadges({ msg }: { msg: EmailMessage }) {
  const badges: { label: string; icon: typeof Mail; className: string }[] = [];

  if (msg.sentAt) {
    badges.push(STATUS_CONFIG.sent);
  }
  if (msg.deliveredAt) {
    badges.push(STATUS_CONFIG.delivered);
  }
  if (msg.openCount > 0) {
    badges.push({
      ...STATUS_CONFIG.opened,
      label: `Abierto (${msg.openCount}x)`,
    });
  }
  if (msg.clickCount > 0) {
    badges.push({
      ...STATUS_CONFIG.clicked,
      label: `Clic (${msg.clickCount}x)`,
    });
  }
  if (msg.bouncedAt) {
    badges.push(STATUS_CONFIG.bounced);
  }

  if (badges.length === 0) {
    badges.push(STATUS_CONFIG.queued);
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
          >
            <Icon className="h-3 w-3" />
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}

interface EmailHistoryListProps {
  dealId?: string;
  contactId?: string;
  accountId?: string;
  title?: string;
  compact?: boolean;
  syncBeforeFetch?: boolean;
}

export function EmailHistoryList({
  dealId,
  contactId,
  accountId,
  title = "Correos",
  compact = false,
  syncBeforeFetch = true,
}: EmailHistoryListProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const syncGmailMessages = useCallback(async () => {
    try {
      await fetch("/api/crm/gmail/sync?max=30", {
        cache: "no-store",
      });
    } catch (error) {
      console.error("Error syncing Gmail:", error);
    }
  }, []);

  const fetchEmails = useCallback(async (options?: { sync?: boolean }) => {
    try {
      const shouldSync = options?.sync ?? syncBeforeFetch;
      if (shouldSync) {
        await syncGmailMessages();
      }

      const params = new URLSearchParams();
      if (dealId) params.set("dealId", dealId);
      if (contactId) params.set("contactId", contactId);
      if (accountId) params.set("accountId", accountId);

      const res = await fetch(`/api/crm/emails?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setEmails(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, [dealId, contactId, accountId, syncBeforeFetch, syncGmailMessages]);

  useEffect(() => {
    void fetchEmails({ sync: syncBeforeFetch });
  }, [fetchEmails, syncBeforeFetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <EmptyState
        icon={<Mail className="h-8 w-8" />}
        title="Sin correos"
        description="No hay correos enviados todavía."
        compact={compact}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {emails.length} correo{emails.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            setLoading(true);
            void fetchEmails({ sync: true });
          }}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Actualizar
        </Button>
      </div>
      {emails.map((msg) => {
        const effectiveStatus = getEffectiveStatus(msg);
        const statusConfig =
          STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.queued;
        const StatusIcon = statusConfig.icon;

        return (
          <div
            key={msg.id}
            className="rounded-lg border border-border p-3 sm:p-4 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {msg.direction === "out" ? (
                  <Send className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <ArrowDownLeft className="h-4 w-4 text-green-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{msg.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {msg.direction === "out"
                      ? `Para: ${msg.toEmails.join(", ")}`
                      : `De: ${msg.fromEmail}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {msg.source === "followup" && (
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-500/30 text-amber-500"
                  >
                    Automático
                  </Badge>
                )}
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusConfig.className}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            <TrackingBadges msg={msg} />

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 pt-1">
              <span>
                {msg.sentAt
                  ? formatDate(msg.sentAt)
                  : formatDate(msg.createdAt)}
              </span>
              {msg.firstOpenedAt && (
                <span>
                  Abierto: {formatDate(msg.firstOpenedAt)}
                </span>
              )}
              {msg.firstClickedAt && (
                <span>
                  Clic: {formatDate(msg.firstClickedAt)}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
