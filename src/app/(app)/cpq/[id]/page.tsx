/**
 * CPQ Quote Detail - Redirect a CRM Cotizaciones
 */

import { redirect } from "next/navigation";

export default async function CpqQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/crm/cotizaciones/${id}`);
}
