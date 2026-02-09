"use client";

import { SubNav } from "@/components/opai/SubNav";

const DOCS_NAV_ITEMS = [
  { href: "/opai/inicio", label: "Presentaciones" },
  { href: "/opai/documentos", label: "Gestión Documental" },
];

export function DocumentosSubnav() {
  return <SubNav items={DOCS_NAV_ITEMS} />;
}
