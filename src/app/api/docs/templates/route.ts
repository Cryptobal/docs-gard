/**
 * API Route: /api/docs/templates
 * GET  - Listar templates de documentos
 * POST - Crear template de documento
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, parseBody } from "@/lib/api-auth";
import { createDocTemplateSchema } from "@/lib/validations/docs";
import { extractTokenKeys } from "@/lib/docs/token-resolver";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module");
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") !== "false";

    const templates = await prisma.docTemplate.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(module ? { module } : {}),
        ...(category ? { category } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { documents: true, versions: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error("Error fetching doc templates:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const parsed = await parseBody(request, createDocTemplateSchema);
    if (parsed.error) return parsed.error;

    const { name, description, content, module, category, isDefault } = parsed.data;

    // Auto-extract tokens from content
    const tokensUsed = extractTokenKeys(content);

    const template = await prisma.$transaction(async (tx) => {
      // If setting as default, unset others in same module+category
      if (isDefault) {
        await tx.docTemplate.updateMany({
          where: {
            tenantId: ctx.tenantId,
            module,
            category,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      const created = await tx.docTemplate.create({
        data: {
          tenantId: ctx.tenantId,
          name,
          description,
          content,
          module,
          category,
          tokensUsed,
          isDefault: isDefault ?? false,
          createdBy: ctx.userId,
        },
        include: {
          _count: {
            select: { documents: true, versions: true },
          },
        },
      });

      // Create initial version
      await tx.docTemplateVersion.create({
        data: {
          templateId: created.id,
          version: 1,
          content,
          changeNote: "Versión inicial",
          createdBy: ctx.userId,
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Ya existe un template con ese nombre en este módulo" },
        { status: 409 }
      );
    }
    console.error("Error creating doc template:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear template" },
      { status: 500 }
    );
  }
}
