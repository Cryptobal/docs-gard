/**
 * Token Registry — Sistema de tokens/placeholders por módulo
 *
 * Define los tokens disponibles para insertar en documentos.
 * Cada token se mapea a un campo de una entidad CRM/CPQ/Payroll.
 */

export interface TokenDefinition {
  key: string;
  label: string;
  path: string;
  type?: "text" | "number" | "date" | "currency" | "table";
  format?: string;
}

export interface TokenModule {
  key: string;
  label: string;
  icon: string;
  description: string;
  tokens: TokenDefinition[];
}

export const TOKEN_MODULES: TokenModule[] = [
  {
    key: "account",
    label: "Cuenta",
    icon: "Building2",
    description: "Datos de la empresa / cuenta",
    tokens: [
      { key: "account.name", label: "Nombre Empresa", path: "name" },
      { key: "account.rut", label: "RUT", path: "rut" },
      { key: "account.legalName", label: "Razón Social", path: "legalName" },
      { key: "account.legalRepresentativeName", label: "Rep. Legal (Nombre)", path: "legalRepresentativeName" },
      { key: "account.legalRepresentativeRut", label: "Rep. Legal (RUT)", path: "legalRepresentativeRut" },
      { key: "account.industry", label: "Industria", path: "industry" },
      { key: "account.segment", label: "Segmento", path: "segment" },
      { key: "account.size", label: "Tamaño", path: "size" },
      { key: "account.website", label: "Sitio Web", path: "website" },
      { key: "account.address", label: "Dirección", path: "address" },
    ],
  },
  {
    key: "contact",
    label: "Contacto",
    icon: "User",
    description: "Datos del contacto principal",
    tokens: [
      { key: "contact.firstName", label: "Nombre", path: "firstName" },
      { key: "contact.lastName", label: "Apellido", path: "lastName" },
      { key: "contact.fullName", label: "Nombre Completo", path: "fullName" },
      { key: "contact.email", label: "Email", path: "email" },
      { key: "contact.phone", label: "Teléfono", path: "phone" },
      { key: "contact.roleTitle", label: "Cargo", path: "roleTitle" },
    ],
  },
  {
    key: "installation",
    label: "Instalación",
    icon: "MapPin",
    description: "Datos de la instalación / sucursal",
    tokens: [
      { key: "installation.name", label: "Nombre Instalación", path: "name" },
      { key: "installation.address", label: "Dirección", path: "address" },
      { key: "installation.city", label: "Ciudad", path: "city" },
      { key: "installation.commune", label: "Comuna", path: "commune" },
    ],
  },
  {
    key: "deal",
    label: "Negocio",
    icon: "Handshake",
    description: "Datos del negocio / oportunidad",
    tokens: [
      { key: "deal.title", label: "Título del Negocio", path: "title" },
      { key: "deal.amount", label: "Monto", path: "amount", type: "currency" },
      { key: "deal.expectedCloseDate", label: "Fecha Cierre Esperada", path: "expectedCloseDate", type: "date" },
      { key: "deal.service", label: "Servicio", path: "service" },
      { key: "deal.installationName", label: "Instalación", path: "installationName" },
      { key: "deal.address", label: "Dirección", path: "address" },
      { key: "deal.city", label: "Ciudad", path: "city" },
      { key: "deal.commune", label: "Comuna", path: "commune" },
    ],
  },
  {
    key: "quote",
    label: "Cotización",
    icon: "FileSpreadsheet",
    description: "Datos de la cotización CPQ",
    tokens: [
      { key: "quote.code", label: "Código Cotización", path: "code" },
      { key: "quote.monthlyCost", label: "Costo Mensual", path: "monthlyCost", type: "currency" },
      { key: "quote.totalPositions", label: "Total Posiciones", path: "totalPositions", type: "number" },
      { key: "quote.totalGuards", label: "Total Guardias", path: "totalGuards", type: "number" },
      { key: "quote.clientName", label: "Cliente (Cotización)", path: "clientName" },
    ],
  },
  {
    key: "system",
    label: "Sistema",
    icon: "Settings",
    description: "Datos del sistema y fechas",
    tokens: [
      { key: "system.today", label: "Fecha Actual", path: "today", type: "date" },
      { key: "system.todayLong", label: "Fecha Actual (texto)", path: "todayLong", type: "date" },
      { key: "system.year", label: "Año Actual", path: "year" },
      { key: "system.month", label: "Mes Actual", path: "month" },
    ],
  },
];

/** Flat map of all tokens by key */
export const TOKEN_MAP = new Map<string, TokenDefinition & { module: string }>();
for (const mod of TOKEN_MODULES) {
  for (const token of mod.tokens) {
    TOKEN_MAP.set(token.key, { ...token, module: mod.key });
  }
}

/** Get tokens for a specific module */
export function getTokensByModule(moduleKey: string): TokenDefinition[] {
  const mod = TOKEN_MODULES.find((m) => m.key === moduleKey);
  return mod?.tokens ?? [];
}

/** Get all available token keys */
export function getAllTokenKeys(): string[] {
  return Array.from(TOKEN_MAP.keys());
}

/** Document categories by module */
export const DOC_CATEGORIES: Record<string, { key: string; label: string }[]> = {
  crm: [
    { key: "contrato_servicio", label: "Contrato de Servicio" },
    { key: "contrato_confidencialidad", label: "Acuerdo de Confidencialidad (NDA)" },
    { key: "acuerdo_nivel_servicio", label: "Acuerdo de Nivel de Servicio (SLA)" },
    { key: "adendum", label: "Adendum / Modificación" },
    { key: "otro_crm", label: "Otro" },
  ],
  payroll: [
    { key: "contrato_laboral", label: "Contrato de Trabajo" },
    { key: "anexo_contrato", label: "Anexo de Contrato" },
    { key: "finiquito", label: "Finiquito" },
    { key: "otro_payroll", label: "Otro" },
  ],
  legal: [
    { key: "poder_notarial", label: "Poder Notarial" },
    { key: "carta_compromiso", label: "Carta de Compromiso" },
    { key: "otro_legal", label: "Otro" },
  ],
};

/** Status labels for documents */
export const DOC_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: "Borrador", color: "bg-gray-100 text-gray-700", icon: "FileEdit" },
  review: { label: "En Revisión", color: "bg-yellow-100 text-yellow-700", icon: "Eye" },
  approved: { label: "Aprobado", color: "bg-blue-100 text-blue-700", icon: "CheckCircle" },
  active: { label: "Activo", color: "bg-green-100 text-green-700", icon: "CheckCircle2" },
  expiring: { label: "Por Vencer", color: "bg-orange-100 text-orange-700", icon: "AlertTriangle" },
  expired: { label: "Vencido", color: "bg-red-100 text-red-700", icon: "XCircle" },
  renewed: { label: "Renovado", color: "bg-purple-100 text-purple-700", icon: "RefreshCw" },
};
