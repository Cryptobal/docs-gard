import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, resolveApiPerms } from "@/lib/api-auth";
import { hasCapability } from "@/lib/permissions";

// ── GET: export rendiciones to XLSX ──

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!hasCapability(perms, "rendicion_export")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para exportar rendiciones" },
        { status: 403 },
      );
    }

    const sp = request.nextUrl.searchParams;
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");
    const status = sp.get("status") || undefined;
    const type = sp.get("type") || undefined;
    const submitterId = sp.get("submitterId") || undefined;

    const where: Record<string, unknown> = {
      tenantId: ctx.tenantId,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(submitterId ? { submitterId } : {}),
      ...(dateFrom || dateTo
        ? {
            date: {
              ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
              ...(dateTo ? { lte: new Date(`${dateTo}T00:00:00.000Z`) } : {}),
            },
          }
        : {}),
    };

    const rendiciones = await prisma.financeRendicion.findMany({
      where,
      include: {
        item: { select: { name: true } },
        costCenter: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    // Fetch submitter names
    const submitterIds = [...new Set(rendiciones.map((r) => r.submitterId))];
    const admins = await prisma.admin.findMany({
      where: { id: { in: submitterIds } },
      select: { id: true, name: true, email: true },
    });
    const adminMap = new Map(admins.map((a) => [a.id, a]));

    // Build XLSX
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rendiciones", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const headers = [
      "Código",
      "Fecha",
      "Rendidor",
      "Tipo",
      "Documento",
      "Ítem",
      "Monto",
      "Estado",
      "Centro de Costo",
      "Descripción",
    ];
    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    // Set column widths
    sheet.columns = [
      { width: 18 }, // Código
      { width: 12 }, // Fecha
      { width: 30 }, // Rendidor
      { width: 12 }, // Tipo
      { width: 12 }, // Documento
      { width: 25 }, // Ítem
      { width: 15 }, // Monto
      { width: 14 }, // Estado
      { width: 25 }, // Centro de Costo
      { width: 40 }, // Descripción
    ];

    const statusLabels: Record<string, string> = {
      DRAFT: "Borrador",
      SUBMITTED: "Enviada",
      IN_APPROVAL: "En aprobación",
      APPROVED: "Aprobada",
      REJECTED: "Rechazada",
      PAID: "Pagada",
    };

    const typeLabels: Record<string, string> = {
      PURCHASE: "Compra",
      MILEAGE: "Kilometraje",
    };

    for (const r of rendiciones) {
      const admin = adminMap.get(r.submitterId);
      const dateStr = r.date.toISOString().slice(0, 10);

      sheet.addRow([
        r.code,
        dateStr,
        admin?.name ?? admin?.email ?? r.submitterId,
        typeLabels[r.type] ?? r.type,
        r.documentType ?? "",
        r.item?.name ?? "",
        r.amount,
        statusLabels[r.status] ?? r.status,
        r.costCenter?.name ?? "",
        r.description ?? "",
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `rendiciones-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("[Finance] Error exporting rendiciones:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron exportar las rendiciones" },
      { status: 500 },
    );
  }
}
