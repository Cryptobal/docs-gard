/**
 * Tickets — Tipos, constantes y helpers para el módulo de Tickets
 *
 * Alineado con ETAPA_2_IMPLEMENTACION.md (OpsTicket, OpsTicketCategory, etc.)
 * Entidades lógicas (sin migración de DB todavía).
 */

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type TicketStatus =
  | "open"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed"
  | "cancelled";

export type TicketPriority = "p1" | "p2" | "p3" | "p4";

export type TicketTeam =
  | "postventa"
  | "ops"
  | "rrhh"
  | "inventario"
  | "finanzas"
  | "it_admin";

export type TicketSource = "manual" | "incident" | "portal" | "guard_event" | "system";

export interface TicketCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  assignedTeam: TicketTeam;
  defaultPriority: TicketPriority;
  slaHours: number;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Ticket {
  id: string;
  tenantId: string;
  code: string; // "TK-202602-0001"
  categoryId: string;
  category?: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  title: string;
  description: string | null;
  assignedTeam: TicketTeam;
  assignedTo: string | null;
  assignedToName?: string | null;
  installationId: string | null;
  installationName?: string | null;
  source: TicketSource;
  sourceLogId: string | null;
  sourceGuardEventId: string | null;
  reportedBy: string;
  reportedByName?: string | null;
  slaDueAt: string | null;
  slaBreached: boolean;
  resolvedAt: string | null;
  closedAt: string | null;
  resolutionNotes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Computed
  commentsCount?: number;
  attachmentsCount?: number;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName?: string | null;
  body: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  commentId: string | null;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  uploadedBy: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const TICKET_STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline"; order: number }
> = {
  open: { label: "Abierto", variant: "warning", order: 0 },
  in_progress: { label: "En progreso", variant: "default", order: 1 },
  waiting: { label: "En espera", variant: "secondary", order: 2 },
  resolved: { label: "Resuelto", variant: "success", order: 3 },
  closed: { label: "Cerrado", variant: "outline", order: 4 },
  cancelled: { label: "Cancelado", variant: "destructive", order: 5 },
};

export const TICKET_PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; color: string; description: string }
> = {
  p1: { label: "P1 — Crítica", color: "text-red-500", description: "Requiere atención inmediata" },
  p2: { label: "P2 — Alta", color: "text-orange-500", description: "Resolver dentro de SLA" },
  p3: { label: "P3 — Media", color: "text-yellow-500", description: "Planificable" },
  p4: { label: "P4 — Baja", color: "text-muted-foreground", description: "Cuando sea posible" },
};

export const TICKET_TEAM_CONFIG: Record<TicketTeam, { label: string }> = {
  postventa: { label: "Postventa" },
  ops: { label: "Operaciones" },
  rrhh: { label: "RRHH" },
  inventario: { label: "Inventario" },
  finanzas: { label: "Finanzas" },
  it_admin: { label: "IT / Admin" },
};

export const TICKET_SOURCE_CONFIG: Record<TicketSource, { label: string }> = {
  manual: { label: "Manual" },
  incident: { label: "Incidente postventa" },
  portal: { label: "Portal guardia" },
  guard_event: { label: "Evento laboral" },
  system: { label: "Sistema" },
};

// ═══════════════════════════════════════════════════════════════
//  SEED DATA — Categories (10 from ETAPA_2 spec)
// ═══════════════════════════════════════════════════════════════

export const TICKET_CATEGORIES_SEED: Omit<TicketCategory, "id">[] = [
  { slug: "incidente_operacional", name: "Incidente operacional", description: "Problema en terreno que requiere acción operativa", assignedTeam: "postventa", defaultPriority: "p2", slaHours: 24, icon: "AlertTriangle", isActive: true, sortOrder: 1 },
  { slug: "novedad_instalacion", name: "Novedad de instalación", description: "Observación o requerimiento de una instalación", assignedTeam: "postventa", defaultPriority: "p3", slaHours: 72, icon: "MapPin", isActive: true, sortOrder: 2 },
  { slug: "ausencia_reemplazo_urgente", name: "Ausencia / Reemplazo urgente", description: "Guardia ausente y necesita reemplazo inmediato", assignedTeam: "ops", defaultPriority: "p1", slaHours: 2, icon: "ShieldAlert", isActive: true, sortOrder: 3 },
  { slug: "solicitud_rrhh", name: "Solicitud RRHH", description: "Solicitud general a recursos humanos", assignedTeam: "rrhh", defaultPriority: "p3", slaHours: 72, icon: "Users", isActive: true, sortOrder: 4 },
  { slug: "permiso_vacaciones_licencia", name: "Permiso / Vacaciones / Licencia", description: "Solicitud de ausencia laboral", assignedTeam: "rrhh", defaultPriority: "p2", slaHours: 48, icon: "CalendarDays", isActive: true, sortOrder: 5 },
  { slug: "uniforme_implementos", name: "Uniforme / Implementos", description: "Solicitud de uniforme, equipo o implementos", assignedTeam: "inventario", defaultPriority: "p3", slaHours: 72, icon: "Package", isActive: true, sortOrder: 6 },
  { slug: "activo_danado_perdido", name: "Activo dañado o perdido", description: "Reporte de equipo dañado, perdido o robado", assignedTeam: "inventario", defaultPriority: "p2", slaHours: 48, icon: "AlertOctagon", isActive: true, sortOrder: 7 },
  { slug: "pago_turno_extra", name: "Pago turno extra", description: "Consulta o reclamo sobre pago de turno extra", assignedTeam: "finanzas", defaultPriority: "p2", slaHours: 48, icon: "Banknote", isActive: true, sortOrder: 8 },
  { slug: "conducta_disciplina", name: "Conducta / Disciplina", description: "Reporte de conducta o situación disciplinaria", assignedTeam: "rrhh", defaultPriority: "p2", slaHours: 48, icon: "Gavel", isActive: true, sortOrder: 9 },
  { slug: "soporte_plataforma", name: "Soporte plataforma", description: "Problema técnico con la plataforma", assignedTeam: "it_admin", defaultPriority: "p3", slaHours: 72, icon: "Monitor", isActive: true, sortOrder: 10 },
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

/** Generate next ticket code */
export function generateTicketCode(sequence: number): string {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `TK-${ym}-${String(sequence).padStart(4, "0")}`;
}

/** Check if SLA is breached */
export function isSlaBreached(slaDueAt: string | null): boolean {
  if (!slaDueAt) return false;
  return new Date() > new Date(slaDueAt);
}

/** Get time remaining for SLA (human readable) */
export function getSlaRemaining(slaDueAt: string | null): string | null {
  if (!slaDueAt) return null;
  const due = new Date(slaDueAt);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) return "Vencido";
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  return `${hours}h ${minutes}m`;
}

/** Whether a ticket can be transitioned to a given status */
export function canTransitionTo(current: TicketStatus, target: TicketStatus): boolean {
  const transitions: Record<TicketStatus, TicketStatus[]> = {
    open: ["in_progress", "waiting", "resolved", "cancelled"],
    in_progress: ["waiting", "resolved", "cancelled"],
    waiting: ["in_progress", "resolved", "cancelled"],
    resolved: ["closed", "in_progress"], // reopen
    closed: [],
    cancelled: [],
  };
  return transitions[current]?.includes(target) ?? false;
}

/** Statuses considered "active" (not terminal) */
export function isActiveStatus(status: TicketStatus): boolean {
  return ["open", "in_progress", "waiting"].includes(status);
}
