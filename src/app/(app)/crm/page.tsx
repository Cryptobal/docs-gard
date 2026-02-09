/**
 * CRM - Customer Relationship Management
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasAppAccess } from '@/lib/app-access';
import { PageHeader } from '@/components/opai';
import { CrmSubnav } from '@/components/crm/CrmSubnav';
import Link from 'next/link';
import { Users, Building, TrendingUp, Contact, DollarSign, FileText, ChevronRight } from 'lucide-react';

const modules = [
  {
    title: 'Leads',
    description: 'Solicitudes entrantes y aprobación manual.',
    icon: Users,
    href: '/crm/leads',
    color: 'text-emerald-400 bg-emerald-400/10',
  },
  {
    title: 'Cuentas',
    description: 'Prospectos y clientes.',
    icon: Building,
    href: '/crm/accounts',
    color: 'text-blue-400 bg-blue-400/10',
  },
  {
    title: 'Negocios',
    description: 'Oportunidades y pipeline.',
    icon: TrendingUp,
    href: '/crm/deals',
    color: 'text-purple-400 bg-purple-400/10',
  },
  {
    title: 'Contactos',
    description: 'Personas clave por cliente.',
    icon: Contact,
    href: '/crm/contacts',
    color: 'text-sky-400 bg-sky-400/10',
  },
  {
    title: 'Cotizaciones',
    description: 'Configurador de precios CPQ.',
    icon: DollarSign,
    href: '/crm/cotizaciones',
    color: 'text-amber-400 bg-amber-400/10',
  },
  {
    title: 'Reportes',
    description: 'Métricas y conversiones.',
    icon: FileText,
    href: '#',
    color: 'text-muted-foreground bg-muted',
    disabled: true,
  },
];

export default async function CRMPage() {
  const session = await auth();
  if (!session?.user) redirect('/opai/login?callbackUrl=/crm');
  if (!hasAppAccess(session.user.role, 'crm')) redirect('/hub');

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Pipeline comercial y gestión de clientes"
      />

      <CrmSubnav />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const inner = (
            <div
              key={mod.title}
              className={`group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all ${
                mod.disabled
                  ? 'opacity-40 cursor-default'
                  : 'hover:border-border/80 hover:bg-accent/40 hover:shadow-md cursor-pointer'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${mod.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{mod.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
              </div>
              {!mod.disabled && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              )}
            </div>
          );

          if (mod.disabled) return inner;
          return <Link key={mod.title} href={mod.href}>{inner}</Link>;
        })}
      </div>
    </div>
  );
}
