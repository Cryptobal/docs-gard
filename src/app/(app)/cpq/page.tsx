/**
 * CPQ - Configure, Price, Quote
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { CpqDashboard } from "@/components/cpq/CpqDashboard";

export default async function CPQPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/cpq");
  }

  if (!hasAppAccess(session.user.role, "cpq")) {
    redirect("/hub");
  }

  return <CpqDashboard />;
}
