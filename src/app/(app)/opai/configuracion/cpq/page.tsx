import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/opai";
import { ConfigBackLink } from "@/components/opai";
import { CpqConfigTabs } from "@/components/cpq/CpqConfigTabs";
import { resolvePagePerms, canView } from "@/lib/permissions-server";

export default async function CpqConfigPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/configuracion/cpq");
  }

  const perms = await resolvePagePerms(session.user);
  if (!canView(perms, "config", "cpq")) {
    redirect("/opai/configuracion");
  }

  return (
    <>
      <ConfigBackLink />
      <PageHeader
        title="Configuración CPQ"
        description="Catálogo, puestos, cargos, roles y parámetros de pricing"
      />
      <CpqConfigTabs />
    </>
  );
}
