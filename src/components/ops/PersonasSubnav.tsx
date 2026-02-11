"use client";

import { SubNav } from "@/components/opai";

export function PersonasSubnav() {
  return (
    <SubNav
      items={[
        { href: "/personas/guardias", label: "Guardias" },
        { href: "/personas/lista-negra", label: "Lista negra" },
      ]}
    />
  );
}
