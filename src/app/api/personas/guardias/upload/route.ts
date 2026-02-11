import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getExtension(fileName: string, mimeType: string): string {
  const parsed = path.extname(fileName || "").toLowerCase();
  if (parsed) return parsed;
  if (mimeType === "application/pdf") return ".pdf";
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  return ".bin";
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Archivo requerido (field: file)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "El archivo excede el máximo de 8MB" },
        { status: 400 }
      );
    }
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: "Tipo de archivo no permitido (solo PDF o imágenes)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "guardias");
    await mkdir(uploadsDir, { recursive: true });
    const extension = getExtension(file.name, mimeType);
    const safeName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const diskPath = path.join(uploadsDir, safeName);
    await writeFile(diskPath, buffer);
    const publicUrl = `/uploads/guardias/${safeName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName: file.name,
        mimeType,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("[PERSONAS] Error uploading guardia document:", error);
    return NextResponse.json(
      { success: false, error: "Error al subir archivo" },
      { status: 500 }
    );
  }
}
