/**
 * Limpieza manual: deja en estado PPC las filas de asistencia diaria cuyo slot
 * en la pauta mensual no tiene guardia planificado (plannedGuardiaId null).
 * Útil cuando quedaron estados "asistio"/"reemplazo"/"pendiente" después de desasignar.
 *
 * Uso: npx tsx scripts/clean-asistencia-ppc.ts YYYY-MM-DD [tenantId]
 *      npx tsx scripts/clean-asistencia-ppc.ts YYYY-MM-DD --all   (todas las filas del día, sin mirar pauta)
 *
 * Si no pasas tenantId, se usa el primer tenant activo.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseDate(value: string): Date {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error("Fecha debe ser YYYY-MM-DD");
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0));
}

async function main() {
  const args = process.argv.slice(2);
  const dateStr = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
  const forceAll = args.includes("--all");
  let tenantId = args.find((a) => a !== dateStr && a !== "--all" && !a.startsWith("-"));

  if (!dateStr) {
    console.error("Uso: npx tsx scripts/clean-asistencia-ppc.ts YYYY-MM-DD [tenantId] [--all]");
    process.exit(1);
  }
  const date = parseDate(dateStr);

  if (!tenantId) {
    const tenant = await prisma.tenant.findFirst({ where: { active: true }, select: { id: true } });
    if (!tenant) {
      console.error("No hay tenant activo. Pasa tenantId como segundo argumento.");
      process.exit(1);
    }
    tenantId = tenant.id;
    console.log("Tenant:", tenantId);
  }

  let rows: { id: string; attendanceStatus: string }[];

  if (forceAll) {
    rows = await prisma.opsAsistenciaDiaria.findMany({
      where: { tenantId, date, lockedAt: null },
      select: { id: true, attendanceStatus: true },
    });
    console.log(`Fecha: ${dateStr}. --all: ${rows.length} fila(s) de asistencia (no bloqueadas).`);
  } else {
    const pautaSinGuardia = await prisma.opsPautaMensual.findMany({
      where: { tenantId, date, plannedGuardiaId: null },
      select: { puestoId: true, slotNumber: true },
    });
    console.log(`Fecha: ${dateStr}. Pauta sin guardia: ${pautaSinGuardia.length} slot(s).`);
    rows = [];
    for (const item of pautaSinGuardia) {
      const r = await prisma.opsAsistenciaDiaria.findMany({
        where: {
          tenantId,
          puestoId: item.puestoId,
          slotNumber: item.slotNumber,
          date,
          lockedAt: null,
        },
        select: { id: true, attendanceStatus: true },
      });
      rows.push(...r);
    }
  }

  let updated = 0;
  let teDeleted = 0;

  for (const row of rows) {
    const pendingTe = await prisma.opsTurnoExtra.findFirst({
      where: { asistenciaId: row.id, status: "pending" },
    });
    if (pendingTe) {
      await prisma.opsTurnoExtra.delete({ where: { id: pendingTe.id } });
      teDeleted++;
    }
    await prisma.opsAsistenciaDiaria.update({
      where: { id: row.id },
      data: {
        attendanceStatus: "ppc",
        actualGuardiaId: null,
        replacementGuardiaId: null,
        teGenerated: false,
      },
    });
    updated++;
    if (row.attendanceStatus !== "ppc") {
      console.log(`  → ${row.id.slice(0, 8)}… estaba "${row.attendanceStatus}", ahora ppc`);
    }
  }

  console.log(`\n✅ Actualizadas ${updated} fila(s) a PPC. TEs pendientes eliminados: ${teDeleted}.`);
  console.log("Recarga Asistencia diaria para la fecha en la app.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
