import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { getDefaultTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/opai";
import { OpsPautaDiariaClient, OpsSubnav } from "@/components/ops";

export default async function OpsPautaDiariaPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/ops/pauta-diaria");
  }
  const role = session.user.role;
  if (!hasAppAccess(role, "ops")) {
    redirect("/hub");
  }

  const tenantId = session.user.tenantId ?? (await getDefaultTenantId());

  const [installations, guardias] = await Promise.all([
    prisma.crmInstallation.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.opsGuardia.findMany({
      where: {
        tenantId,
        status: "active",
        isBlacklisted: false,
      },
      select: {
        id: true,
        code: true,
        persona: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pauta diaria"
        description="Control diario de asistencia, reemplazos y generación de turnos extra."
      />
      <OpsSubnav />
      <OpsPautaDiariaClient
        installations={JSON.parse(JSON.stringify(installations))}
        guardias={JSON.parse(JSON.stringify(guardias))}
      />
    </div>
  );
}
