"use client";

import { SubNav } from "@/components/opai";

export function OpsSubnav() {
  return (
    <SubNav
      items={[
        { href: "/ops/puestos", label: "Puestos" },
        { href: "/ops/pauta-mensual", label: "Pauta mensual" },
        { href: "/ops/pauta-diaria", label: "Pauta diaria" },
        { href: "/ops/ppc", label: "PPC" },
      ]}
    />
  );
}
