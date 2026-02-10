"use client";

import { formatDateShort, formatDateTimeShort } from "@/lib/utils";

/**
 * Fechas de creación y última modificación, minimalistas para listas CRM.
 * showTime: si es true, muestra fecha y hora de creación (y de modificación si aplica).
 */
export function CrmDates({
  createdAt,
  updatedAt,
  showTime = false,
  className = "",
}: {
  createdAt: string;
  updatedAt?: string | null;
  showTime?: boolean;
  className?: string;
}) {
  if (!createdAt) return null;
  const formatFn = showTime ? formatDateTimeShort : formatDateShort;
  const created = formatFn(createdAt);
  if (created === "Invalid Date") return null;
  const updated = updatedAt ? formatFn(updatedAt) : null;
  return (
    <p className={`text-[11px] text-muted-foreground/80 ${className}`}>
      Creado {created}
      {updated && updated !== "Invalid Date" && updated !== created ? ` · Modif. ${updated}` : ""}
    </p>
  );
}
