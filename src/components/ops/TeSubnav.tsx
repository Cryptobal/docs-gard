"use client";

import { SubNav } from "@/components/opai";

export function TeSubnav() {
  return (
    <SubNav
      items={[
        { href: "/te/registro", label: "Registro" },
        { href: "/te/aprobaciones", label: "Aprobaciones" },
        { href: "/te/lotes", label: "Lotes" },
        { href: "/te/pagos", label: "Pagos" },
      ]}
    />
  );
}
