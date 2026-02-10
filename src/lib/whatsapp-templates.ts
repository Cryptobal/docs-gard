/**
 * WhatsApp Template Token Resolver
 *
 * Reemplaza tokens tipo {nombre} en plantillas de WhatsApp.
 * Usado tanto en el API público de leads como en follow-ups y propuestas.
 */

import { prisma } from "@/lib/prisma";

/** Reemplaza tokens {key} en un template con valores del mapa */
export function resolveWaTokens(
  template: string,
  values: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    // Match both {key} format
    const token = key.startsWith("{") ? key : `{${key}}`;
    result = result.replaceAll(token, value || "");
  }
  // Limpiar tokens no resueltos (ej: {proposalLink} cuando no hay link)
  result = result.replace(/\{[a-zA-Z_]+\}/g, "");
  // Limpiar líneas vacías duplicadas resultantes de tokens vacíos
  result = result.replace(/\n{3,}/g, "\n\n").trim();
  return result;
}

/**
 * Obtiene el body de una plantilla de WhatsApp por slug.
 * Si no existe en la DB, retorna el template por defecto.
 */
export async function getWaTemplate(
  tenantId: string,
  slug: string
): Promise<string> {
  // Lazy import to avoid circular deps at module level
  const { WA_TEMPLATE_DEFAULTS } = await import(
    "@/app/api/crm/whatsapp-templates/route"
  );

  const saved = await prisma.crmWhatsAppTemplate.findUnique({
    where: { tenantId_slug: { tenantId, slug } },
  });

  if (saved?.isActive && saved.body) {
    return saved.body;
  }

  return WA_TEMPLATE_DEFAULTS[slug]?.body ?? "";
}
