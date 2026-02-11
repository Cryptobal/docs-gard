import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import {
  DOCUMENT_TYPES,
  isChileanRutFormat,
  isValidChileanRut,
  isValidMobileNineDigits,
  lifecycleToLegacyStatus,
  normalizeMobileNineDigits,
  normalizeNullable,
  normalizeRut,
} from "@/lib/personas";
import { isValidPostulacionToken } from "@/lib/postulacion-token";

const postulacionSchema = z.object({
  token: z.string().trim().min(8, "Token inválido"),
  firstName: z.string().trim().min(1, "Nombre es requerido").max(100),
  lastName: z.string().trim().min(1, "Apellido es requerido").max(100),
  rut: z
    .string()
    .trim()
    .refine((v) => isChileanRutFormat(v), "RUT debe ir sin puntos y con guión")
    .refine((v) => isValidChileanRut(v), "RUT chileno inválido")
    .transform((v) => normalizeRut(v)),
  email: z.string().trim().email("Email inválido").max(200),
  phoneMobile: z
    .string()
    .trim()
    .refine((v) => isValidMobileNineDigits(v), "Celular debe tener exactamente 9 dígitos")
    .transform((v) => normalizeMobileNineDigits(v)),
  addressFormatted: z.string().trim().min(5, "Dirección es requerida").max(300),
  commune: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  region: z.string().trim().max(120).optional().nullable(),
  documents: z
    .array(
      z.object({
        type: z.enum(DOCUMENT_TYPES),
        fileUrl: z
          .string()
          .trim()
          .max(2000)
          .refine((value) => value.startsWith("/uploads/guardias/"), "Archivo inválido"),
      })
    )
    .default([]),
});

function buildNextGuardiaCode(lastCode?: string | null): string {
  if (!lastCode) return "G-000001";
  const match = /^G-(\d{6})$/.exec(lastCode);
  const next = (match ? Number(match[1]) : 0) + 1;
  return `G-${String(next).padStart(6, "0")}`;
}

async function generateUniqueGuardiaCode(
  tx: Prisma.TransactionClient,
  tenantId: string
): Promise<string> {
  const rows = await tx.$queryRaw<Array<{ code: string | null }>>`
    SELECT code
    FROM ops.guardias
    WHERE tenant_id = ${tenantId}
      AND code ~ '^G-[0-9]{6}$'
    ORDER BY code DESC
    LIMIT 1
  `;
  return buildNextGuardiaCode(rows[0]?.code ?? null);
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = postulacionSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
      return NextResponse.json({ success: false, error: issues }, { status: 400 });
    }

    const body = parsed.data;
    if (!isValidPostulacionToken(body.token)) {
      return NextResponse.json({ success: false, error: "Token de postulación inválido" }, { status: 403 });
    }

    const tenantId = await getDefaultTenantId();
    const existingByRut = await prisma.opsPersona.findFirst({
      where: { tenantId, rut: body.rut },
      select: { id: true },
    });
    if (existingByRut) {
      return NextResponse.json(
        { success: false, error: "Ya existe una persona registrada con ese RUT" },
        { status: 409 }
      );
    }

    let createdGuardia: { id: string; code: string | null } | null = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        createdGuardia = await prisma.$transaction(async (tx) => {
          const persona = await tx.opsPersona.create({
            data: {
              tenantId,
              firstName: body.firstName,
              lastName: body.lastName,
              rut: body.rut,
              email: normalizeNullable(body.email),
              phoneMobile: normalizeNullable(body.phoneMobile),
              addressFormatted: normalizeNullable(body.addressFormatted),
              // En autogestión pública no exigimos Google Place ID.
              addressSource: "manual",
              commune: normalizeNullable(body.commune),
              city: normalizeNullable(body.city),
              region: normalizeNullable(body.region),
              status: "active",
            },
          });

          const code = await generateUniqueGuardiaCode(tx, tenantId);
          const guardia = await tx.opsGuardia.create({
            data: {
              tenantId,
              personaId: persona.id,
              code,
              lifecycleStatus: "postulante",
              status: lifecycleToLegacyStatus("postulante"),
            },
            select: { id: true, code: true },
          });

          if (body.documents.length > 0) {
            await tx.opsDocumentoPersona.createMany({
              data: body.documents.map((doc) => ({
                tenantId,
                guardiaId: guardia.id,
                type: doc.type,
                fileUrl: doc.fileUrl,
                status: "pendiente",
              })),
            });
          }

          await tx.opsGuardiaHistory.create({
            data: {
              tenantId,
              guardiaId: guardia.id,
              eventType: "public_postulation_submitted",
              newValue: {
                source: "public_postulation",
                docs: body.documents.length,
              },
            },
          });

          return guardia;
        });
        break;
      } catch (error) {
        const duplicateCodeError =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
        if (!duplicateCodeError || attempt === 3) throw error;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          guardiaId: createdGuardia?.id,
          code: createdGuardia?.code ?? null,
          message: "Postulación enviada correctamente",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POSTULACION] Error creating public postulation:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo enviar la postulación" },
      { status: 500 }
    );
  }
}
