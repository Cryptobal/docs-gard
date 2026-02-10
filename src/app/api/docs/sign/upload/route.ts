/**
 * API Route: /api/docs/sign/upload
 * POST - Subir imagen de firma (público)
 *
 * Nota: En esta versión (PR3), se retorna data URL temporal.
 * En una etapa posterior se reemplazará por almacenamiento persistente.
 */

import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Archivo de firma requerido (field: file)" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Solo se permiten imágenes (image/*)" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "La imagen excede el máximo de 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      data: {
        url: dataUrl,
        mimeType: file.type,
        size: file.size,
        mode: "temporary_inline_data_url",
      },
    });
  } catch (error) {
    console.error("Error uploading signature image:", error);
    return NextResponse.json(
      { success: false, error: "Error al subir imagen de firma" },
      { status: 500 }
    );
  }
}
