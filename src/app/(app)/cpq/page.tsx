/**
 * CPQ - Redirect a CRM Cotizaciones
 */

import { redirect } from "next/navigation";

export default function CPQPage() {
  redirect("/crm/cotizaciones");
}
