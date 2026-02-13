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
  if (!canView(perms, "ops")) {
    redirect("/hub");
  }

  const tenantId = session.user.tenantId ?? (await getDefaultTenantId());

  const [clients, puestos, asignaciones, guardias] = await Promise.all([
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
  ]);

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
      />
    </div>
  );
}
