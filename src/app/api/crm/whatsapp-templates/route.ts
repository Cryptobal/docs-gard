/**
 * API Route: /api/crm/whatsapp-templates
 * GET  - Obtener todas las plantillas de WhatsApp del tenant
 * POST - Crear o actualizar plantillas (upsert por slug)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";

/** Plantillas por defecto con sus tokens disponibles */
export const WA_TEMPLATE_DEFAULTS: Record<
  string,
  { name: string; body: string; tokens: string[] }
> = {
  lead_commercial: {
    name: "Nuevo lead — Comercial al cliente",
    body: `Hola {nombre}, ¿cómo estás?

Recibimos tu solicitud de cotización para {empresa}, ubicada en {direccion}.

Estamos preparando una propuesta personalizada para ti. Si tienes alguna duda en el proceso, responde este mensaje y te ayudamos de inmediato.

Servicio: {servicio} | Dotación: {dotacion}

http://gard.cl`,
    tokens: [
      "{nombre}",
      "{apellido}",
      "{empresa}",
      "{direccion}",
      "{comuna}",
      "{ciudad}",
      "{servicio}",
      "{dotacion}",
      "{email}",
      "{celular}",
      "{pagina_web}",
      "{industria}",
      "{detalle}",
    ],
  },
  lead_client: {
    name: "Nuevo lead — Cliente a Gard",
    body: `Hola, soy {nombre} {apellido} de la empresa {empresa}.`,
    tokens: ["{nombre}", "{apellido}", "{empresa}"],
  },
  proposal_sent: {
    name: "Propuesta enviada",
    body: `Hola {contactName}, te envío la propuesta de Gard Security para {companyName}:

{proposalUrl}`,
    tokens: ["{contactName}", "{companyName}", "{proposalUrl}"],
  },
  followup_first: {
    name: "1er seguimiento",
    body: `Hola {contactName}, ¿cómo estás?

Te hago seguimiento a la propuesta de {dealTitle} enviada el {proposalSentDate}.

{proposalLink}

Cualquier duda quedo atento. Saludos!`,
    tokens: [
      "{contactName}",
      "{dealTitle}",
      "{accountName}",
      "{proposalLink}",
      "{proposalSentDate}",
    ],
  },
  followup_second: {
    name: "2do seguimiento",
    body: `Hola {contactName}, ¿cómo estás?

Te escribo nuevamente respecto a la propuesta de {dealTitle} que te enviamos el {proposalSentDate}.

¿Has tenido oportunidad de revisarla? Si necesitas que ajustemos algo, estoy disponible.

{proposalLink}

Saludos!`,
    tokens: [
      "{contactName}",
      "{dealTitle}",
      "{accountName}",
      "{proposalLink}",
      "{proposalSentDate}",
    ],
  },
};

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const templates = await prisma.crmWhatsAppTemplate.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { slug: "asc" },
    });

    // Merge with defaults (show all slugs, even if not yet saved)
    const slugs = Object.keys(WA_TEMPLATE_DEFAULTS);
    const merged = slugs.map((slug) => {
      const saved = templates.find((t) => t.slug === slug);
      const def = WA_TEMPLATE_DEFAULTS[slug];
      return {
        slug,
        name: def.name,
        body: saved?.body ?? def.body,
        isActive: saved?.isActive ?? true,
        tokens: def.tokens,
        saved: !!saved,
      };
    });

    return NextResponse.json({ success: true, data: merged });
  } catch (error) {
    console.error("Error fetching WhatsApp templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const body = await request.json();

    if (!body?.slug || !body?.body?.trim()) {
      return NextResponse.json(
        { success: false, error: "Slug y body son requeridos" },
        { status: 400 }
      );
    }

    const def = WA_TEMPLATE_DEFAULTS[body.slug as string];
    if (!def) {
      return NextResponse.json(
        { success: false, error: "Slug inválido" },
        { status: 400 }
      );
    }

    const template = await prisma.crmWhatsAppTemplate.upsert({
      where: {
        tenantId_slug: {
          tenantId: ctx.tenantId,
          slug: body.slug,
        },
      },
      update: {
        body: body.body.trim(),
        isActive: body.isActive ?? true,
      },
      create: {
        tenantId: ctx.tenantId,
        slug: body.slug,
        name: def.name,
        body: body.body.trim(),
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("Error saving WhatsApp template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save template" },
      { status: 500 }
    );
  }
}
