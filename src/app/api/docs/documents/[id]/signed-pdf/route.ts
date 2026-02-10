/**
 * API Route: /api/docs/documents/[id]/signed-pdf
 * GET - Genera PDF del documento con firmas embebidas
 */

import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright-core";
import chromiumPkg from "@sparticuz/chromium";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function tiptapToText(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(tiptapToText).join("");
  if (node.type === "text") return node.text ?? "";
  const children = (node.content ?? []).map(tiptapToText).join("");
  if (node.type === "paragraph") return `${children}\n\n`;
  if (node.type === "heading") return `${children}\n\n`;
  if (node.type === "bulletList" || node.type === "orderedList") return `${children}\n`;
  if (node.type === "listItem") return `• ${children}\n`;
  return children;
}

/** Formatea fecha para PDF */
function formatSignDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
}

/** Resuelve tokens de firma en el contenido para el PDF (todos los firmantes ya firmaron) */
function resolveSignatureTokensForPdf(
  content: unknown,
  ctx: {
    sentAt: Date | null;
    signers: Array< { name: string; signingOrder: number; signedAt: Date | null } >;
  }
): unknown {
  if (!content || typeof content !== "object") return content;
  const node = content as { type?: string; attrs?: { tokenKey?: string }; content?: unknown[] };
  if (Array.isArray(content)) {
    return (content as unknown[]).map((child) => resolveSignatureTokensForPdf(child, ctx));
  }
  if (node.type === "contractToken" && node.attrs?.tokenKey) {
    const key = node.attrs.tokenKey as string;
    if (key === "signature.sentDate")
      return { type: "text", text: formatSignDate(ctx.sentAt) };
    if (key === "signature.signedDate") {
      const lastSigned = ctx.signers.reduce((prev, s) => (!prev || (s.signedAt && (!prev.signedAt || s.signedAt > prev.signedAt))) ? s : prev, null as typeof ctx.signers[0] | null);
      return { type: "text", text: formatSignDate(lastSigned?.signedAt ?? null) };
    }
    const signerMatch = /^signature\.signer_(\d+)$/.exec(key === "signature.placeholder" ? "signature.signer_1" : key);
    if (signerMatch) {
      const order = parseInt(signerMatch[1], 10);
      const signer = ctx.signers.find((s) => s.signingOrder === order);
      if (!signer) return { type: "text", text: "[—]" };
      return {
        type: "text",
        text: `[Firmado por ${signer.name} el ${formatSignDate(signer.signedAt)}]`,
      };
    }
  }
  if (node.content && Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map((child) => resolveSignatureTokensForPdf(child, ctx)),
    };
  }
  return content;
}

function buildSignedDocumentHtml(input: {
  title: string;
  bodyText: string;
  signedAt: string;
  signers: Array<{
    name: string;
    email: string;
    rut: string | null;
    method: string | null;
    signedAt: string | null;
    signatureImageUrl?: string | null;
    signatureTypedName?: string | null;
    signatureFontFamily?: string | null;
  }>;
}) {
  const signersHtml = input.signers
    .map((signer) => {
      const signatureBlock =
        signer.method === "typed"
          ? `<div style="font-family:${escapeHtml(signer.signatureFontFamily || "cursive")};font-size:28px;line-height:1.1">${escapeHtml(signer.signatureTypedName || signer.name)}</div>`
          : signer.signatureImageUrl
          ? `<img src="${signer.signatureImageUrl}" alt="Firma ${escapeHtml(signer.name)}" style="max-height:72px;max-width:220px;object-fit:contain" />`
          : `<div style="font-style:italic;color:#6b7280">Firma no disponible</div>`;

      return `
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px;">
        <div style="font-size:13px;color:#111827;font-weight:700;margin-bottom:8px">${escapeHtml(signer.name)}</div>
        <div style="font-size:12px;color:#334155;margin-bottom:8px">${escapeHtml(signer.email)}${signer.rut ? ` · RUT: ${escapeHtml(signer.rut)}` : ""}</div>
        <div style="margin-bottom:8px">${signatureBlock}</div>
        <div style="font-size:11px;color:#64748b">Firmado: ${escapeHtml(signer.signedAt ?? "-")}</div>
      </div>
      `;
    })
    .join("");

  return `
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #0f172a; padding: 28px; }
      h1 { font-size: 24px; margin: 0 0 8px; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
      .section-title { font-size: 14px; font-weight: 700; margin: 18px 0 8px; }
      .content { white-space: pre-wrap; line-height: 1.5; font-size: 13px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
      .foot { margin-top: 22px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(input.title)}</h1>
    <div class="meta">Documento firmado electrónicamente · Cierre de firma: ${escapeHtml(input.signedAt)}</div>
    <div class="section-title">Contenido</div>
    <div class="content">${escapeHtml(input.bodyText)}</div>
    <div class="section-title">Firmas</div>
    ${signersHtml}
    <div class="foot">Generado automáticamente por OPAI</div>
  </body>
</html>`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const { id } = await params;
    const document = await prisma.document.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        signatureRequests: {
          where: { status: "completed" },
          include: {
            recipients: {
              where: { role: "signer", status: "signed" },
              orderBy: [{ signingOrder: "asc" }, { createdAt: "asc" }],
            },
          },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: "Documento no encontrado" }, { status: 404 });
    }

    const completedRequest = document.signatureRequests[0];
    if (!completedRequest) {
      return NextResponse.json(
        { success: false, error: "Documento sin firma completada" },
        { status: 400 }
      );
    }

    const signedAt = (completedRequest.completedAt ?? document.signedAt ?? new Date()).toLocaleString("es-CL");
    const sentAt = completedRequest.createdAt ?? null;
    const signers = completedRequest.recipients.map((r) => ({
      name: r.name,
      signingOrder: r.signingOrder,
      signedAt: r.signedAt,
    }));
    const resolvedContent =
      document.content && typeof document.content === "object"
        ? resolveSignatureTokensForPdf(JSON.parse(JSON.stringify(document.content)), { sentAt, signers })
        : document.content;
    const bodyText = tiptapToText(resolvedContent).trim() || "(Sin contenido textual)";

    const html = buildSignedDocumentHtml({
      title: document.title,
      bodyText,
      signedAt,
      signers: completedRequest.recipients.map((r) => ({
        name: r.name,
        email: r.email,
        rut: r.rut,
        method: r.signatureMethod,
        signedAt: r.signedAt ? r.signedAt.toLocaleString("es-CL") : null,
        signatureImageUrl: r.signatureImageUrl,
        signatureTypedName: r.signatureTypedName,
        signatureFontFamily: r.signatureFontFamily,
      })),
    });

    const executablePath = await chromiumPkg.executablePath();
    const browser = await chromium.launch({
      args: chromiumPkg.args,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
    });
    await browser.close();

    await prisma.document.update({
      where: { id: document.id },
      data: {
        pdfGeneratedAt: new Date(),
      },
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=\"${document.title.replace(/[^a-zA-Z0-9-_]/g, "_")}-firmado.pdf\"`,
      },
    });
  } catch (error) {
    console.error("Error generating signed PDF:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar PDF firmado" },
      { status: 500 }
    );
  }
}
