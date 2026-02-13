import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolvePagePerms, canView } from "@/lib/permissions-server";
import { getDefaultTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/opai";
import { OpsSubnav, OpsPuestosClient } from "@/components/ops";

export default async function OpsPuestosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/ops/puestos");
  }
  const perms = await resolvePagePerms(session.user);
  if (!canView(perms, "ops", "puestos")) {
    redirect("/hub");
  }

  const tenantId = session.user.tenantId ?? (await getDefaultTenantId());

  // Current month range for pauta coverage check
  const now = new Date();
  const curMonth = now.getUTCMonth(); // 0-based
  const curYear = now.getUTCFullYear();
  const monthStart = new Date(Date.UTC(curYear, curMonth, 1));
  const monthEnd = new Date(Date.UTC(curYear, curMonth + 1, 0, 23, 59, 59));

  const [clients, puestos, asignaciones, guardias, pautaRows] = await Promise.all([
    prisma.crmAccount.findMany({
      where: { tenantId, type: "client", isActive: true },
      select: {
        id: true,
        name: true,
        rut: true,
        installations: {
          where: { isActive: true },
          select: { id: true, name: true, teMontoClp: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.opsPuestoOperativo.findMany({
      where: { tenantId },
      include: {
        installation: { select: { id: true, name: true, teMontoClp: true } },
        cargo: { select: { id: true, name: true } },
        rol: { select: { id: true, name: true } },
      },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    }),
    prisma.opsAsignacionGuardia.findMany({
      where: { tenantId, isActive: true },
      include: {
        guardia: {
          select: {
            id: true,
            code: true,
            lifecycleStatus: true,
            persona: { select: { firstName: true, lastName: true, rut: true } },
          },
        },
      },
      orderBy: { slotNumber: "asc" },
    }),
    prisma.opsGuardia.findMany({
      where: {
        tenantId,
        status: "active",
        isBlacklisted: false,
        lifecycleStatus: { in: ["seleccionado", "contratado_activo"] },
      },
      select: {
        id: true,
        code: true,
        lifecycleStatus: true,
        persona: { select: { firstName: true, lastName: true, rut: true } },
      },
      orderBy: [{ persona: { lastName: "asc" } }],
    }),
    // Pauta coverage: which installations have pauta for the current month
    prisma.opsPautaMensual.groupBy({
      by: ["installationId"],
      where: {
        tenantId,
        date: { gte: monthStart, lte: monthEnd },
      },
      _count: { id: true },
    }),
  ]);

  // Build coverage map: installationId → true
  const pautaCoverage: Record<string, boolean> = {};
  for (const row of pautaRows) {
    if (row._count.id > 0) {
      pautaCoverage[row.installationId] = true;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Puestos operativos"
        description="Estructura, slots y asignación de guardias por instalación."
      />
      <OpsSubnav />
      <OpsPuestosClient
        initialClients={JSON.parse(JSON.stringify(clients))}
        initialPuestos={JSON.parse(JSON.stringify(puestos))}
        initialAsignaciones={JSON.parse(JSON.stringify(asignaciones))}
        guardias={JSON.parse(JSON.stringify(guardias))}
        pautaCoverage={pautaCoverage}
      />
    </div>
  );
}
