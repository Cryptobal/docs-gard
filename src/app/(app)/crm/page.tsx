/**
 * CRM - Inicio Ejecutivo
 *
 * Rediseño orientado a operación comercial:
 * - Alertas priorizadas y accionables
 * - KPIs estratégicos de funnel y conversión
 * - Atajos de creación e ingreso por módulo
 * - Colas operativas (leads, tareas, seguimientos)
 * - Actividad reciente del CRM
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  Handshake,
  LayoutDashboard,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { hasAppAccess } from '@/lib/app-access';
import { prisma } from '@/lib/prisma';
import { getDefaultTenantId } from '@/lib/tenant';
import { formatCLP, formatNumber, timeAgo } from '@/lib/utils';
import { CrmSubnav } from '@/components/crm/CrmSubnav';
import { KpiCard, PageHeader } from '@/components/opai';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

type DashboardAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  href: string;
  cta: string;
  count: number;
};

const ALERT_STYLES: Record<
  AlertSeverity,
  {
    icon: LucideIcon;
    badgeVariant: BadgeVariant;
    cardClass: string;
    iconClass: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    badgeVariant: 'destructive',
    cardClass: 'border-red-500/30 bg-red-500/5',
    iconClass: 'bg-red-500/10 text-red-400',
  },
  warning: {
    icon: Clock3,
    badgeVariant: 'warning',
    cardClass: 'border-amber-500/30 bg-amber-500/5',
    iconClass: 'bg-amber-500/10 text-amber-400',
  },
  info: {
    icon: BellRing,
    badgeVariant: 'default',
    cardClass: 'border-primary/30 bg-primary/5',
    iconClass: 'bg-primary/10 text-primary',
  },
  success: {
    icon: CheckCircle2,
    badgeVariant: 'success',
    cardClass: 'border-emerald-500/30 bg-emerald-500/5',
    iconClass: 'bg-emerald-500/10 text-emerald-400',
  },
};

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  new_lead: 'Nuevo lead',
  lead_approved: 'Lead aprobado',
  quote_sent: 'Cotización enviada',
  quote_viewed: 'Cotización vista',
  contract_required: 'Contrato requerido',
  contract_expiring: 'Contrato por vencer',
  contract_expired: 'Contrato vencido',
  email_opened: 'Email abierto',
  email_clicked: 'Email con clic',
  email_bounced: 'Email rebotado',
  followup_sent: 'Seguimiento enviado',
  followup_scheduled: 'Seguimiento programado',
  followup_failed: 'Seguimiento fallido',
};

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return (part / total) * 100;
}

function leadContactName(firstName?: string | null, lastName?: string | null): string {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || 'Sin contacto';
}

function dueLabel(date: Date, now: Date): string {
  const dayMs = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / dayMs);

  if (diffDays < 0) {
    if (diffDays === -1) return 'Venció ayer';
    return `Venció hace ${Math.abs(diffDays)} días`;
  }
  if (diffDays === 0) return 'Vence hoy';
  if (diffDays === 1) return 'Vence mañana';
  return `Vence en ${diffDays} días`;
}

export default async function CRMPage() {
  const session = await auth();
  if (!session?.user) redirect('/opai/login?callbackUrl=/crm');
  if (!hasAppAccess(session.user.role, 'crm')) redirect('/hub');

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysForward = new Date(now);
  thirtyDaysForward.setDate(thirtyDaysForward.getDate() + 30);
  const operationalHorizon = new Date(now);
  operationalHorizon.setDate(operationalHorizon.getDate() + 3);

  const [
    totalLeads,
    pendingLeads,
    newLeads7d,
    leadsCreated30d,
    approvedLeads30d,
    totalAccounts,
    totalClients,
    totalProspects,
    totalContacts,
    totalInstallations,
    openDealsRaw,
    activeStages,
    wonDeals30d,
    lostDeals30d,
    totalQuotes,
    sentQuotes30d,
    approvedQuotes30d,
    unreadNotifications,
    recentNotifications,
    overdueTasks,
    dueTodayTasks,
    tasksOpen,
    overdueFollowUps,
    followUpsToday,
    pendingLeadsQueue,
    urgentTasksQueue,
    followUpsQueue,
    upcomingClosings,
  ] = await Promise.all([
    prisma.crmLead.count({ where: { tenantId } }),
    prisma.crmLead.count({ where: { tenantId, status: 'pending' } }),
    prisma.crmLead.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.crmLead.count({ where: { tenantId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.crmLead.count({
      where: {
        tenantId,
        status: 'approved',
        approvedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.crmAccount.count({ where: { tenantId } }),
    prisma.crmAccount.count({ where: { tenantId, type: 'client' } }),
    prisma.crmAccount.count({ where: { tenantId, type: 'prospect' } }),
    prisma.crmContact.count({ where: { tenantId } }),
    prisma.crmInstallation.count({ where: { tenantId } }),
    prisma.crmDeal.findMany({
      where: { tenantId, status: 'open' },
      orderBy: [{ probability: 'desc' }, { updatedAt: 'asc' }],
      select: {
        id: true,
        title: true,
        amount: true,
        probability: true,
        stageId: true,
        expectedCloseDate: true,
        updatedAt: true,
        account: {
          select: {
            name: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            order: true,
            isClosedWon: true,
            isClosedLost: true,
          },
        },
      },
    }),
    prisma.crmPipelineStage.findMany({
      where: { tenantId, isActive: true },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        order: true,
        isClosedWon: true,
        isClosedLost: true,
      },
    }),
    prisma.crmDeal.count({
      where: { tenantId, status: 'won', updatedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.crmDeal.count({
      where: { tenantId, status: 'lost', updatedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.cpqQuote.count({ where: { tenantId } }),
    prisma.cpqQuote.count({
      where: { tenantId, status: 'sent', updatedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.cpqQuote.count({
      where: { tenantId, status: 'approved', updatedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.notification.count({
      where: { tenantId, read: false },
    }),
    prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        link: true,
        createdAt: true,
      },
    }),
    prisma.crmTask.count({
      where: { tenantId, status: 'open', dueAt: { lt: now } },
    }),
    prisma.crmTask.count({
      where: { tenantId, status: 'open', dueAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.crmTask.count({
      where: { tenantId, status: 'open' },
    }),
    prisma.crmFollowUpLog.count({
      where: { tenantId, status: 'pending', scheduledAt: { lt: now } },
    }),
    prisma.crmFollowUpLog.count({
      where: { tenantId, status: 'pending', scheduledAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.crmLead.findMany({
      where: { tenantId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 6,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        companyName: true,
        source: true,
        createdAt: true,
      },
    }),
    prisma.crmTask.findMany({
      where: {
        tenantId,
        status: 'open',
        dueAt: { not: null, lte: operationalHorizon },
      },
      orderBy: { dueAt: 'asc' },
      take: 6,
      select: {
        id: true,
        title: true,
        dueAt: true,
        type: true,
        deal: {
          select: {
            id: true,
            title: true,
            account: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.crmFollowUpLog.findMany({
      where: {
        tenantId,
        status: 'pending',
        scheduledAt: { lte: operationalHorizon },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 6,
      select: {
        id: true,
        sequence: true,
        scheduledAt: true,
        deal: {
          select: {
            id: true,
            title: true,
            account: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.crmDeal.findMany({
      where: {
        tenantId,
        status: 'open',
        expectedCloseDate: { not: null, lte: thirtyDaysForward },
      },
      orderBy: { expectedCloseDate: 'asc' },
      take: 6,
      select: {
        id: true,
        title: true,
        expectedCloseDate: true,
        amount: true,
        probability: true,
        account: {
          select: {
            name: true,
          },
        },
        stage: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const openDeals = openDealsRaw.filter((deal) => !deal.stage.isClosedWon && !deal.stage.isClosedLost);
  const openDealsCount = openDeals.length;
  const pipelineAmount = openDeals.reduce((sum, deal) => sum + Number(deal.amount), 0);
  const weightedForecast = openDeals.reduce(
    (sum, deal) => sum + Number(deal.amount) * (deal.probability / 100),
    0
  );
  const avgProbability = openDealsCount > 0
    ? openDeals.reduce((sum, deal) => sum + deal.probability, 0) / openDealsCount
    : 0;

  const leadApprovalRate30d = pct(approvedLeads30d, leadsCreated30d);
  const winRate30d = pct(wonDeals30d, wonDeals30d + lostDeals30d);
  const quoteConversion30d = pct(approvedQuotes30d, sentQuotes30d);

  const staleThreshold = new Date(now);
  staleThreshold.setDate(staleThreshold.getDate() - 14);
  const staleDealsCount = openDeals.filter((deal) => deal.updatedAt < staleThreshold).length;
  const dealsWithoutExpectedDate = openDeals.filter((deal) => !deal.expectedCloseDate).length;

  type StageSummary = {
    id: string;
    name: string;
    order: number;
    isClosedWon: boolean;
    isClosedLost: boolean;
    count: number;
    amount: number;
  };

  const stagesMap = new Map<string, StageSummary>();

  for (const stage of activeStages) {
    stagesMap.set(stage.id, {
      ...stage,
      count: 0,
      amount: 0,
    });
  }

  for (const deal of openDeals) {
    if (!stagesMap.has(deal.stageId)) {
      stagesMap.set(deal.stageId, {
        id: deal.stageId,
        name: deal.stage.name,
        order: deal.stage.order,
        isClosedWon: deal.stage.isClosedWon,
        isClosedLost: deal.stage.isClosedLost,
        count: 0,
        amount: 0,
      });
    }
    const stage = stagesMap.get(deal.stageId);
    if (!stage) continue;
    stage.count += 1;
    stage.amount += Number(deal.amount);
  }

  const stageSummaries = [...stagesMap.values()].sort((a, b) => a.order - b.order);
  const maxStageAmount = Math.max(1, ...stageSummaries.map((stage) => stage.amount));

  const alerts: DashboardAlert[] = [];
  if (overdueTasks > 0) {
    alerts.push({
      id: 'tasks-overdue',
      severity: 'critical',
      title: 'Tareas comerciales vencidas',
      description: 'Hay compromisos sin cerrar que impactan el ciclo comercial.',
      href: '/crm/deals',
      cta: 'Resolver tareas',
      count: overdueTasks,
    });
  }
  if (overdueFollowUps > 0) {
    alerts.push({
      id: 'followups-overdue',
      severity: 'critical',
      title: 'Seguimientos automáticos fuera de plazo',
      description: 'Es clave reactivar seguimiento para no perder oportunidades.',
      href: '/crm/deals',
      cta: 'Revisar seguimientos',
      count: overdueFollowUps,
    });
  }
  if (pendingLeads > 0) {
    alerts.push({
      id: 'leads-pending',
      severity: 'warning',
      title: 'Leads sin calificación',
      description: 'Existen leads pendientes de aprobación y conversión a negocio.',
      href: '/crm/leads',
      cta: 'Calificar leads',
      count: pendingLeads,
    });
  }
  if (dealsWithoutExpectedDate > 0) {
    alerts.push({
      id: 'deals-no-date',
      severity: 'warning',
      title: 'Negocios sin fecha probable de cierre',
      description: 'Falta visibilidad temporal para proyectar flujo de ingresos.',
      href: '/crm/deals',
      cta: 'Completar fechas',
      count: dealsWithoutExpectedDate,
    });
  }
  if (staleDealsCount > 0) {
    alerts.push({
      id: 'stale-deals',
      severity: 'warning',
      title: 'Negocios estancados (+14 días sin cambios)',
      description: 'Revisa bloqueos y define siguiente acción para reactivar.',
      href: '/crm/deals',
      cta: 'Destrabar pipeline',
      count: staleDealsCount,
    });
  }
  if (unreadNotifications > 0) {
    alerts.push({
      id: 'notifications-unread',
      severity: 'info',
      title: 'Notificaciones pendientes',
      description: 'Existen eventos del CRM sin revisar.',
      href: '/crm',
      cta: 'Ver actividad',
      count: unreadNotifications,
    });
  }
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-good',
      severity: 'success',
      title: 'Operación comercial al día',
      description: 'No hay alertas críticas activas en este momento.',
      href: '/crm/deals',
      cta: 'Ir al pipeline',
      count: 0,
    });
  }

  const criticalAlertsCount = alerts.filter((alert) => alert.severity === 'critical').length;

  const creationShortcuts = [
    {
      title: 'Crear lead',
      description: 'Registrar prospecto entrante y activar aprobación.',
      href: '/crm/leads',
      icon: UserPlus,
      badge: `${pendingLeads} pendientes`,
      colorClass: 'text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Crear cuenta',
      description: 'Agregar prospecto/cliente para iniciar relación.',
      href: '/crm/accounts',
      icon: Building2,
      badge: `${totalAccounts} cuentas`,
      colorClass: 'text-blue-400 bg-blue-500/10',
    },
    {
      title: 'Crear negocio',
      description: 'Abrir oportunidad en el pipeline comercial.',
      href: '/crm/deals',
      icon: BriefcaseBusiness,
      badge: `${openDealsCount} abiertos`,
      colorClass: 'text-purple-400 bg-purple-500/10',
    },
    {
      title: 'Crear cotización',
      description: 'Ingresar al CPQ y generar propuesta económica.',
      href: '/cpq',
      icon: DollarSign,
      badge: `${totalQuotes} cotizaciones`,
      colorClass: 'text-amber-400 bg-amber-500/10',
    },
  ];

  const accessShortcuts = [
    { label: 'Ingresar a Leads', href: '/crm/leads', metric: `${pendingLeads} por revisar` },
    { label: 'Ingresar a Cuentas', href: '/crm/accounts', metric: `${totalClients} clientes` },
    { label: 'Ingresar a Negocios', href: '/crm/deals', metric: `${openDealsCount} en curso` },
    { label: 'Ingresar a Cotizaciones', href: '/crm/cotizaciones', metric: `${totalQuotes} totales` },
    { label: 'Ingresar a Contactos', href: '/crm/contacts', metric: `${totalContacts} registrados` },
    {
      label: 'Ingresar a Instalaciones',
      href: '/crm/installations',
      metric: `${totalInstallations} activas`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inicio CRM · Centro Comercial"
        description={
          <>
            Vista ejecutiva de alertas, funnel y operación comercial.
            {' · '}
            <span className="text-foreground/80">
              Actualizado {now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/crm/leads">
                <Plus className="h-3.5 w-3.5" />
                Nuevo lead
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/crm/deals">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Nuevo negocio
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href="/cpq">
                <DollarSign className="h-3.5 w-3.5" />
                Nueva cotización
              </Link>
            </Button>
          </div>
        }
      />

      <CrmSubnav />

      {/* Alertas + Pulso operativo */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              Centro de alertas CRM
            </CardTitle>
            <CardDescription>Prioriza lo urgente y ejecuta acciones inmediatas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => {
              const style = ALERT_STYLES[alert.severity];
              const Icon = style.icon;

              return (
                <div key={alert.id} className={`rounded-lg border p-3 ${style.cardClass}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${style.iconClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <Badge variant={style.badgeVariant}>
                          {alert.count > 0 ? `${alert.count}` : 'OK'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 shrink-0">
                      <Link href={alert.href}>
                        {alert.cta}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Pulso operativo
            </CardTitle>
            <CardDescription>Estado del día en una sola vista</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Alertas críticas</p>
              <p className="mt-1 text-2xl font-semibold">{criticalAlertsCount}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Tareas que vencen hoy</p>
              <p className="mt-1 text-lg font-semibold">{dueTodayTasks}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Seguimientos programados hoy</p>
              <p className="mt-1 text-lg font-semibold">{followUpsToday}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Notificaciones sin leer</p>
              <p className="mt-1 text-lg font-semibold">{unreadNotifications}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs ejecutivos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Leads nuevos (7d)"
          value={newLeads7d}
          description={`${pendingLeads} pendientes por calificar`}
          icon={<Users className="h-4 w-4" />}
          trend={newLeads7d > 0 ? 'up' : 'neutral'}
          variant="emerald"
        />
        <KpiCard
          title="Aprobación leads (30d)"
          value={`${formatNumber(leadApprovalRate30d, { minDecimals: 1, maxDecimals: 1 })}%`}
          description={`${approvedLeads30d}/${leadsCreated30d} aprobados`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          trend={leadApprovalRate30d >= 35 ? 'up' : leadApprovalRate30d >= 20 ? 'neutral' : 'down'}
          variant="blue"
        />
        <KpiCard
          title="Negocios abiertos"
          value={openDealsCount}
          description="oportunidades activas"
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          trend={openDealsCount > 0 ? 'up' : 'neutral'}
          variant="purple"
        />
        <KpiCard
          title="Pipeline abierto"
          value={formatCLP(pipelineAmount)}
          description="monto total en negociación"
          icon={<DollarSign className="h-4 w-4" />}
          trend={pipelineAmount > 0 ? 'up' : 'neutral'}
          variant="amber"
        />
        <KpiCard
          title="Forecast ponderado"
          value={formatCLP(weightedForecast)}
          description={`Probabilidad promedio ${formatNumber(avgProbability, { minDecimals: 1, maxDecimals: 1 })}%`}
          icon={<Target className="h-4 w-4" />}
          trend={weightedForecast > 0 ? 'up' : 'neutral'}
          variant="indigo"
        />
        <KpiCard
          title="Tasa de cierre (30d)"
          value={`${formatNumber(winRate30d, { minDecimals: 1, maxDecimals: 1 })}%`}
          description={`${wonDeals30d} ganados · ${lostDeals30d} perdidos`}
          icon={<Handshake className="h-4 w-4" />}
          trend={winRate30d >= 30 ? 'up' : winRate30d >= 15 ? 'neutral' : 'down'}
          variant="teal"
        />
        <KpiCard
          title="Conversión cotizaciones (30d)"
          value={`${formatNumber(quoteConversion30d, { minDecimals: 1, maxDecimals: 1 })}%`}
          description={`${approvedQuotes30d}/${sentQuotes30d} aprobadas`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={quoteConversion30d >= 25 ? 'up' : quoteConversion30d >= 10 ? 'neutral' : 'down'}
          variant="sky"
        />
        <KpiCard
          title="Backlog operativo"
          value={tasksOpen}
          description={`${overdueTasks} tareas vencidas · ${overdueFollowUps} seguimientos vencidos`}
          icon={<ListChecks className="h-4 w-4" />}
          trend={overdueTasks + overdueFollowUps > 0 ? 'down' : 'up'}
          variant="default"
        />
      </div>

      {/* Accesos directos + funnel */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accesos directos de creación e ingreso</CardTitle>
            <CardDescription>Flujos rápidos para operar y capturar datos en CRM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Creación rápida
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {creationShortcuts.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{item.title}</p>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                          <Badge variant="outline" className="mt-2">
                            {item.badge}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ingreso por módulo
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {accessShortcuts.map((shortcut) => (
                  <Link
                    key={shortcut.label}
                    href={shortcut.href}
                    className="rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                  >
                    <p className="text-sm font-medium">{shortcut.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{shortcut.metric}</p>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embudo comercial (pipeline activo)</CardTitle>
            <CardDescription>Distribución por etapa con volumen y valor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stageSummaries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Aún no hay etapas activas para mostrar.
              </div>
            ) : (
              stageSummaries.map((stage) => {
                const fill = Math.max(4, Math.round((stage.amount / maxStageAmount) * 100));
                return (
                  <div key={stage.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{stage.name}</p>
                      <Badge variant="outline">{stage.count} negocios</Badge>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatCLP(stage.amount)}</span>
                      <span>
                        {stage.count > 0
                          ? `${formatCLP(stage.amount / stage.count)} promedio`
                          : 'Sin monto registrado'}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Colas operativas + actividad */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Leads por atender
            </CardTitle>
            <CardDescription>Priorizados por antigüedad de ingreso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingLeadsQueue.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No hay leads pendientes. Excelente ritmo de calificación.
              </div>
            ) : (
              pendingLeadsQueue.map((lead) => (
                <Link
                  key={lead.id}
                  href="/crm/leads"
                  className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {lead.companyName || leadContactName(lead.firstName, lead.lastName)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {leadContactName(lead.firstName, lead.lastName)}
                        {' · '}
                        {lead.source || 'Origen manual'}
                      </p>
                    </div>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(lead.createdAt)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              Tareas y seguimientos
            </CardTitle>
            <CardDescription>Próximos 3 días (incluye vencidos)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tareas comerciales
              </p>
              <div className="space-y-2">
                {urgentTasksQueue.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                    Sin tareas urgentes.
                  </p>
                ) : (
                  urgentTasksQueue.map((task) => {
                    if (!task.dueAt) return null;
                    const dueDate = new Date(task.dueAt);
                    const isOverdue = dueDate < now;
                    return (
                      <Link
                        key={task.id}
                        href={task.deal ? `/crm/deals/${task.deal.id}` : '/crm/deals'}
                        className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{task.title}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {task.deal?.account?.name || 'Sin cuenta'}
                              {' · '}
                              {task.deal?.title || 'Sin negocio asociado'}
                            </p>
                          </div>
                          <Badge variant={isOverdue ? 'destructive' : 'warning'}>
                            {dueLabel(dueDate, now)}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Seguimientos automáticos
              </p>
              <div className="space-y-2">
                {followUpsQueue.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                    No hay seguimientos pendientes en ventana crítica.
                  </p>
                ) : (
                  followUpsQueue.map((followUp) => {
                    const scheduledAt = new Date(followUp.scheduledAt);
                    const isOverdue = scheduledAt < now;
                    return (
                      <Link
                        key={followUp.id}
                        href={`/crm/deals/${followUp.deal.id}`}
                        className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              Seguimiento #{followUp.sequence} · {followUp.deal.account.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{followUp.deal.title}</p>
                          </div>
                          <Badge variant={isOverdue ? 'destructive' : 'outline'}>
                            {dueLabel(scheduledAt, now)}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-muted-foreground" />
              Actividad reciente
            </CardTitle>
            <CardDescription>Eventos de CRM para seguimiento ejecutivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentNotifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Sin actividad reciente.
              </div>
            ) : (
              recentNotifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link || '/crm'}
                  className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {NOTIFICATION_TYPE_LABELS[item.type] || item.type}
                      </p>
                    </div>
                    <Badge variant={item.read ? 'outline' : 'default'}>
                      {item.read ? 'Leída' : 'Nueva'}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.message || 'Sin detalle'}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(item.createdAt)}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cierres próximos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            Próximos cierres comerciales
          </CardTitle>
          <CardDescription>
            Negocios con fecha estimada de cierre en los próximos 30 días
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingClosings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No hay cierres próximos definidos. Completa fechas para mejorar el forecast.
            </div>
          ) : (
            upcomingClosings.map((deal) => {
              const closeDate = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null;
              return (
                <Link
                  key={deal.id}
                  href={`/crm/deals/${deal.id}`}
                  className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{deal.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {deal.account.name}
                        {' · '}
                        {deal.stage.name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{formatCLP(Number(deal.amount))}</p>
                      <p className="text-xs text-muted-foreground">{deal.probability}% prob.</p>
                    </div>
                  </div>
                  {closeDate && (
                    <p className="mt-1 text-[11px] text-muted-foreground">{dueLabel(closeDate, now)}</p>
                  )}
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Meta resumen */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Contexto:</span>{' '}
        {totalLeads} leads totales, {totalProspects} prospectos, {totalClients} clientes y {totalQuotes} cotizaciones en base.
      </div>
    </div>
  );
}
