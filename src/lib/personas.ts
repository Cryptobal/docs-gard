export const GUARDIA_LIFECYCLE_STATUSES = [
  "postulante",
  "seleccionado",
  "contratado_activo",
  "inactivo",
  "desvinculado",
] as const;

export type GuardiaLifecycleStatus = (typeof GUARDIA_LIFECYCLE_STATUSES)[number];

export const DOCUMENT_TYPES = [
  "certificado_antecedentes",
  "certificado_os10",
  "cedula_identidad",
  "curriculum",
  "contrato",
  "anexo_contrato",
] as const;

export type GuardiaDocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUS = [
  "pendiente",
  "vigente",
  "vencido",
  "rechazado",
] as const;

export type GuardiaDocumentStatus = (typeof DOCUMENT_STATUS)[number];

export const BANK_ACCOUNT_TYPES = [
  "cuenta_corriente",
  "cuenta_vista",
  "cuenta_rut",
] as const;

export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export const CHILE_BANKS = [
  { code: "BCH", name: "Banco de Chile" },
  { code: "BSC", name: "Banco Santander Chile" },
  { code: "BCE", name: "BancoEstado" },
  { code: "BCI", name: "Banco de Crédito e Inversiones (BCI)" },
  { code: "ITAU", name: "Banco Itaú Chile" },
  { code: "SEC", name: "Banco Security" },
  { code: "FAL", name: "Banco Falabella" },
  { code: "RIP", name: "Banco Ripley" },
  { code: "CON", name: "Banco Consorcio" },
  { code: "INT", name: "Banco Internacional" },
  { code: "CHI", name: "Banco BICE" },
  { code: "EDW", name: "Banco Edwards-Citi" },
  { code: "SCO", name: "Scotiabank Chile" },
  { code: "HSBC", name: "HSBC Bank Chile" },
  { code: "TENPO", name: "Tenpo Prepago / Cuenta" },
  { code: "MACH", name: "MACH (Bci)" },
].sort((a, b) => a.name.localeCompare(b.name, "es"));

export const CHILE_BANK_CODES = CHILE_BANKS.map((b) => b.code);

export function normalizeNullable(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeRut(input: string): string {
  const compact = input.trim().replace(/\./g, "").toUpperCase();
  return compact;
}

export function isChileanRutFormat(input: string): boolean {
  return /^\d{7,8}-[\dK]$/.test(normalizeRut(input));
}

export function isValidChileanRut(input: string): boolean {
  const rut = normalizeRut(input);
  if (!isChileanRutFormat(rut)) return false;
  const [body, dvInput] = rut.split("-");
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const dvExpected =
    remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return dvInput === dvExpected;
}

export function normalizeMobileNineDigits(value: string): string {
  const onlyDigits = value.replace(/\D/g, "");
  if (onlyDigits.startsWith("56") && onlyDigits.length === 11) {
    return onlyDigits.slice(2);
  }
  return onlyDigits;
}

export function isValidMobileNineDigits(value: string): boolean {
  return /^9\d{8}$/.test(normalizeMobileNineDigits(value));
}

export const GUARDIA_COMM_CHANNELS = ["email", "whatsapp"] as const;
export type GuardiaCommunicationChannel = (typeof GUARDIA_COMM_CHANNELS)[number];

export type GuardiaCommunicationTemplate = {
  id: string;
  channel: GuardiaCommunicationChannel;
  name: string;
  subject?: string;
  body: string;
};

export const GUARDIA_COMM_TEMPLATES: GuardiaCommunicationTemplate[] = [
  {
    id: "docs_pendientes_email",
    channel: "email",
    name: "Solicitud de documentos",
    subject: "Documentos pendientes para tu postulación",
    body: "Hola {nombre}, por favor sube tus documentos pendientes para continuar tu proceso en Gard Security.",
  },
  {
    id: "entrevista_email",
    channel: "email",
    name: "Convocatoria a entrevista",
    subject: "Convocatoria a entrevista",
    body: "Hola {nombre}, te invitamos a entrevista. Responde este correo para coordinar disponibilidad.",
  },
  {
    id: "docs_pendientes_whatsapp",
    channel: "whatsapp",
    name: "Solicitud de documentos",
    body: "Hola {nombre}, necesitamos tus documentos pendientes (antecedentes, OS-10, cédula y CV).",
  },
  {
    id: "recordatorio_whatsapp",
    channel: "whatsapp",
    name: "Recordatorio de gestión",
    body: "Hola {nombre}, te recordamos completar tu ficha de guardia y responder este mensaje ante cualquier duda.",
  },
];

export function renderGuardiaTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, token: string) => vars[token] ?? "");
}

export function lifecycleToLegacyStatus(status: GuardiaLifecycleStatus): "active" | "inactive" {
  if (status === "contratado_activo") return "active";
  return "inactive";
}

