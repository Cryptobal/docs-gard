import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/opai";
import { NotificationConfigClient } from "@/components/opai/NotificationConfigClient";

export default async function NotificacionesConfigPage() {
  const session = await auth();
  if (!session?.user) redirect("/opai/login");

  const role = session.user.role;
  if (role !== "owner" && role !== "admin") redirect("/opai/configuracion");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificaciones"
        description="Configura qué notificaciones recibes por campana y por correo electrónico"
      />
      <NotificationConfigClient />
    </div>
  );
}
