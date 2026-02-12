/**
 * CRM - Customer Relationship Management
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasCrmSubmoduleAccess } from '@/lib/module-access';
import { getDefaultTenantId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/opai';
import { CrmSubnav } from '@/components/crm/CrmSubnav';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CRM_MODULES, type CrmModuleKey } from '@/components/crm/CrmModuleIcons';

type CrmModuleCard = {
  key: Parameters<typeof hasCrmSubmoduleAccess>[1] | null;
  moduleKey: CrmModuleKey;
  description: string;
  href: string;
  countKey: 'leads' | 'accounts' | 'installations' | 'deals' | 'contacts' | 'quotes' | null;
  disabled?: boolean;
};

const modules: CrmModuleCard[] = [
  {
    key: 'leads' as const,
    moduleKey: 'leads',
    description: 'Solicitudes entrantes y aprobación manual.',
    href: '/crm/leads',
    countKey: 'leads' as const,
  },
  {
    key: 'accounts' as const,
    moduleKey: 'accounts',
    description: 'Prospectos y clientes.',
    href: '/crm/accounts',
    countKey: null,
  },
  {
    key: 'installations' as const,
    moduleKey: 'installations',
    description: 'Sedes y ubicaciones de clientes.',
    href: '/crm/installations',
    countKey: null,
  },
  {
    key: 'deals' as const,
    moduleKey: 'deals',
    description: 'Oportunidades y pipeline.',
    href: '/crm/deals',
    countKey: null,
  },
  {
    key: 'contacts' as const,
    moduleKey: 'contacts',
    description: 'Personas clave por cliente.',
    href: '/crm/contacts',
    countKey: null,
  },
  {
    key: 'quotes' as const,
    moduleKey: 'quotes',
    description: 'Configurador de precios CPQ.',
    href: '/crm/cotizaciones',
    countKey: null,
  },
  {
    key: null,
    moduleKey: 'reports',
    description: 'Métricas y conversiones.',
    href: '#',
    disabled: true,
    countKey: null,
  },
];

export default async function CRMPage() {
  const session = await auth();
  if (!session?.user) redirect('/opai/login?callbackUrl=/crm');
  const role = session.user.role;
  if (!hasCrmSubmoduleAccess(role, 'overview')) redirect('/hub');

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());

  const leadsCount = await prisma.crmLead.count({
    where: { tenantId, status: "pending" },
  });

  const counts: Record<string, number> = {
    leads: leadsCount,
  };
  const visibleModules = modules.filter(
    (mod) =>
      mod.disabled ||
      (mod.key !== null && hasCrmSubmoduleAccess(role, mod.key))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Pipeline comercial y gestión de clientes"
      />

      <CrmSubnav role={role} />

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visibleModules.map((mod) => {
          const moduleConfig = CRM_MODULES[mod.moduleKey];
          const Icon = moduleConfig.icon;
          const count = mod.countKey ? counts[mod.countKey] ?? 0 : null;
          const inner = (
            <div
              key={moduleConfig.labelPlural}
              className={`group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all ${
                mod.disabled
                  ? 'opacity-40 cursor-default'
                  : 'hover:border-border/80 hover:bg-accent/40 hover:shadow-md cursor-pointer'
              }`}
            >
              <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${moduleConfig.color}`}>
                <Icon className="h-4 w-4" />
                {!mod.disabled && count !== null && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background"
                    title={`Pendientes: ${count}`}
                  >
                    {count > 999 ? '999+' : count}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{moduleConfig.labelPlural}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
              </div>
              {!mod.disabled && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              )}
            </div>
          );

          if (mod.disabled) return inner;
          return <Link key={moduleConfig.labelPlural} href={mod.href}>{inner}</Link>;
        })}
      </div>
    </div>
  );
}
