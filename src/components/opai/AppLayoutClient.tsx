'use client';

import { ReactNode } from 'react';
import {
  FileText,
  Building2,
  Grid3x3,
  Calculator,
  ClipboardList,
  Settings,
  Receipt,
} from 'lucide-react';
import { AppShell, AppSidebar, type NavItem } from '@/components/opai';
import { type RolePermissions, hasModuleAccess } from '@/lib/permissions';

interface AppLayoutClientProps {
  children: ReactNode;
  userName?: string;
  userEmail?: string;
  userRole: string;
  permissions: RolePermissions;
}

export function AppLayoutClient({
  children,
  userName,
  userEmail,
  userRole,
  permissions,
}: AppLayoutClientProps) {
  const navItems: NavItem[] = [
    {
      href: '/hub',
      label: 'Inicio',
      icon: Grid3x3,
      show: hasModuleAccess(permissions, 'hub'),
    },
    {
      href: '/opai/inicio',
      label: 'Documentos',
      icon: FileText,
      show: hasModuleAccess(permissions, 'docs'),
    },
    {
      href: '/crm',
      label: 'CRM',
      icon: Building2,
      show: hasModuleAccess(permissions, 'crm'),
    },
    {
      href: '/payroll',
      label: 'Payroll',
      icon: Calculator,
      show: hasModuleAccess(permissions, 'payroll'),
    },
    {
      href: '/ops',
      label: 'Operaciones',
      icon: ClipboardList,
      show: hasModuleAccess(permissions, 'ops'),
    },
    {
      href: '/finanzas',
      label: 'Finanzas',
      icon: Receipt,
      show: hasModuleAccess(permissions, 'finance'),
    },
    {
      href: '/opai/configuracion',
      label: 'Configuración',
      icon: Settings,
      show: hasModuleAccess(permissions, 'config'),
    },
  ];

  return (
    <AppShell
      sidebar={
        <AppSidebar
          navItems={navItems}
          userName={userName ?? undefined}
          userEmail={userEmail ?? undefined}
        />
      }
      userName={userName ?? undefined}
      userEmail={userEmail ?? undefined}
      userRole={userRole}
    >
      {children}
    </AppShell>
  );
}
