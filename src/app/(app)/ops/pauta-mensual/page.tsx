import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { getDefaultTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/opai";
import { OpsPautaMensualClient, OpsSubnav } from "@/components/ops";

export default async function OpsPautaMensualPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/ops/pauta-mensual");
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
            rut: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pauta mensual"
        description="Genera el plan del mes y asigna guardias por puesto y día."
      />
      <OpsSubnav />
      <OpsPautaMensualClient
        installations={JSON.parse(JSON.stringify(installations))}
        guardias={JSON.parse(JSON.stringify(guardias))}
      />
    </div>
  );
}
