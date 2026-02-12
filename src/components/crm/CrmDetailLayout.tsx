"use client";

import type { ReactNode } from "react";
import { CrmRecordHeader, type CrmRecordHeaderProps } from "./CrmRecordHeader";
import { CrmSectionNav, type SectionNavItem } from "./CrmSectionNav";
import { CollapsibleSection } from "./CollapsibleSection";
import { CRM_SECTIONS, type CrmSectionKey } from "./CrmModuleIcons";
import { cn } from "@/lib/utils";

/* ── Types ── */

export interface DetailSection {
  /** Key de la sección (debe coincidir con CrmSectionKey) */
  key: CrmSectionKey;
  /** Override del label por defecto */
  label?: string;
  /** Conteo para la nav y el header de sección */
  count?: number;
  /** Acción en el header de la sección (ej: botón "Agregar") */
  action?: ReactNode;
  /** Contenido de la sección */
  children: ReactNode;
  /** Si la sección empieza colapsada (default: abierta) */
  defaultCollapsed?: boolean;
}

interface CrmDetailLayoutProps extends CrmRecordHeaderProps {
  /** Secciones del detalle (se renderizan en el orden dado) */
  sections: DetailSection[];
  /** Clases CSS adicionales al contenedor */
  className?: string;
}

/**
 * CrmDetailLayout — Layout wrapper para páginas de detalle CRM.
 *
 * Orquesta:
 * 1. CrmRecordHeader (sticky, con icono, título, badge, acciones, link "Volver")
 * 2. CrmSectionNav (tabs de anclas sticky con intersection observer)
 * 3. Secciones con CollapsibleSection (cada una con id para anclas)
 *
 * Uso:
 * ```tsx
 * <CrmDetailLayout
 *   module="accounts"
 *   title={account.name}
 *   subtitle="Cliente activo · Seguridad"
 *   badge={{ label: "Activo", variant: "success" }}
 *   backHref="/crm/accounts"
 *   actions={[{ label: "Editar", icon: Pencil, onClick: handleEdit }]}
 *   sections={[
 *     { key: "general", children: <GeneralSection /> },
 *     { key: "contacts", count: 5, children: <ContactsSection /> },
 *   ]}
 * />
 * ```
 */
export function CrmDetailLayout({
  sections,
  className,
  // RecordHeader props
  module,
  title,
  subtitle,
  badge,
  backHref,
  backLabel,
  actions,
  extra,
}: CrmDetailLayoutProps) {
  // Construir items de nav a partir de las secciones
  const navItems: SectionNavItem[] = sections.map((s) => ({
    key: s.key,
    label: s.label,
    count: s.count,
  }));

  return (
    <div className={cn("relative", className)}>
      {/* Header sticky */}
      <CrmRecordHeader
        module={module}
        title={title}
        subtitle={subtitle}
        badge={badge}
        backHref={backHref}
        backLabel={backLabel}
        actions={actions}
        extra={extra}
      />

      {/* Navegación por secciones */}
      <CrmSectionNav sections={navItems} />

      {/* Secciones */}
      <div className="mt-6 space-y-4">
        {sections.map((section) => {
          const config = CRM_SECTIONS[section.key];
          const Icon = config.icon;
          const label = section.label || config.label;

          return (
            <div key={section.key} id={`section-${section.key}`} className="scroll-mt-32">
              <CollapsibleSection
                icon={<Icon className="h-4 w-4" />}
                title={label}
                count={section.count}
                action={section.action}
                defaultOpen={!section.defaultCollapsed}
              >
                {section.children}
              </CollapsibleSection>
            </div>
          );
        })}
      </div>
    </div>
  );
}
