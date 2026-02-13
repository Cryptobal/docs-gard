import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, resolveApiPerms } from "@/lib/api-auth";
import { hasCapability } from "@/lib/permissions";
import { CHILE_BANKS } from "@/lib/personas";

type Params = { id: string };

// ── GET: generate Santander XLSX ──

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const perms = await resolveApiPerms(ctx);

    if (!hasCapability(perms, "rendicion_pay")) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para exportar pagos" },
        { status: 403 },
      );
    }

    const { id } = await params;

    const payment = await prisma.financePayment.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        rendiciones: {
          select: {
            id: true,
            code: true,
            amount: true,
            submitterId: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Pago no encontrado" },
        { status: 404 },
      );
    }

    // Get tenant config for account number
    const config = await prisma.financeRendicionConfig.findUnique({
      where: { tenantId: ctx.tenantId },
      select: { santanderAccountNumber: true },
    });
    const cuentaOrigen = config?.santanderAccountNumber ?? "";

    // Collect unique submitter IDs
    const submitterIds = [...new Set(payment.rendiciones.map((r) => r.submitterId))];

    // Fetch admin users (submitters)
    const admins = await prisma.admin.findMany({
      where: { id: { in: submitterIds } },
      select: { id: true, name: true, email: true },
    });
    const adminMap = new Map(admins.map((a) => [a.id, a]));

    // Fetch OpsPersona matching admin emails → OpsGuardia → bankAccounts
    const adminEmails = admins.map((a) => a.email).filter(Boolean);
    const personas = await prisma.opsPersona.findMany({
      where: {
        tenantId: ctx.tenantId,
        email: { in: adminEmails },
      },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        rut: true,
        guardia: {
          select: {
            bankAccounts: {
              orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            },
          },
        },
      },
    });

    // Map email → persona data
    const personaByEmail = new Map(
      personas.map((p) => [p.email, p]),
    );

    // Group rendiciones by submitter
    const bySubmitter = new Map<string, number>();
    for (const r of payment.rendiciones) {
      bySubmitter.set(r.submitterId, (bySubmitter.get(r.submitterId) ?? 0) + r.amount);
    }

    // Build Excel
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Santander", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    const headers = [
      "Cuenta origen",
      "Moneda origen",
      "Cuenta destino",
      "Moneda destino",
      "Codigo banco destino",
      "RUT beneficiario",
      "Nombre beneficiario",
      "Monto transferencia",
      "Glosa personalizada transferencia",
      "Correo beneficiario",
      "Mensaje correo beneficiario",
      "Glosa cartola originador",
      "Glosa cartola beneficiario",
    ];
    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };

    for (const [submitterId, totalAmount] of bySubmitter.entries()) {
      const admin = adminMap.get(submitterId);
      if (!admin) continue;

      const persona = personaByEmail.get(admin.email);
      const account = persona?.guardia?.bankAccounts?.[0];

      const fullName = persona
        ? `${persona.firstName ?? ""} ${persona.lastName ?? ""}`.trim()
        : admin.name;

      const rut = persona?.rut ?? "";
      const sbifCode = account?.bankCode
        ? CHILE_BANKS.find((b) => b.code === account.bankCode)?.sbifCode ?? ""
        : "";

      sheet.addRow([
        cuentaOrigen,
        "CLP",
        account?.accountNumber ?? "",
        "CLP",
        sbifCode,
        rut,
        fullName,
        totalAmount,
        payment.code,
        admin.email ?? "",
        "",
        "",
        "",
      ]);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${payment.code}-santander.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[Finance] Error exporting Santander XLSX:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo exportar el archivo Santander" },
      { status: 500 },
    );
  }
}
