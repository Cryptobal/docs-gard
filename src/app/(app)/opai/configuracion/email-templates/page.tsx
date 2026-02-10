/**
 * Redirige a Configuración. Las plantillas de correo se gestionan en
 * Gestión Documental → Templates (módulo Mail).
 */
import { redirect } from "next/navigation";

export default function EmailTemplatesPage() {
  redirect("/opai/configuracion");
}
