import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/opai";
import { TeLotesClient, TeSubnav } from "@/components/ops";

export default async function TeLotesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/te/lotes");
  }
  const role = session.user.role;
  if (!hasAppAccess(role, "ops")) {
    redirect("/hub");
  }

  const tenantId = session.user.tenantId ?? (await getDefaultTenantId());
  const lotes = await prisma.opsPagoTeLote.findMany({
    where: { tenantId },
    include: {
      items: {
        select: {
          id: true,
          amountClp: true,
          status: true,
          turnoExtraId: true,
          guardiaId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="TE · Lotes"
        description="Agrupa turnos aprobados para pago semanal."
      />
      <TeSubnav />
      <TeLotesClient initialLotes={JSON.parse(JSON.stringify(lotes))} />
    </div>
  );
}
