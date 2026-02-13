import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolvePagePerms, canView } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/opai";
import { ListaNegraClient, PersonasSubnav } from "@/components/ops";

export default async function ListaNegraPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/personas/lista-negra");
  }
  const perms = await resolvePagePerms(session.user);
  if (!canView(perms, "ops", "guardias")) {
    redirect("/hub");
  }

  const tenantId = session.user.tenantId ?? (await getDefaultTenantId());
  const items = await prisma.opsGuardia.findMany({
    where: {
      tenantId,
      isBlacklisted: true,
    },
    include: {
      persona: {
        select: {
          firstName: true,
          lastName: true,
          rut: true,
          phone: true,
          email: true,
        },
      },
    },
    orderBy: [{ blacklistedAt: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personas · Lista negra"
        description="Bloqueo operativo de guardias para pauta y turnos extra."
      />
      <PersonasSubnav />
      <ListaNegraClient initialItems={JSON.parse(JSON.stringify(items))} />
    </div>
  );
}
