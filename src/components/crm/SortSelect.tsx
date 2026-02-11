"use client";

import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SortOption {
  key: string;
  label: string;
}

export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { key: "newest", label: "Más reciente" },
  { key: "oldest", label: "Más antiguo" },
  { key: "az", label: "A → Z" },
  { key: "za", label: "Z → A" },
];

interface SortSelectProps {
  options?: SortOption[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export function SortSelect({
  options = DEFAULT_SORT_OPTIONS,
  active,
  onChange,
  className,
}: SortSelectProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <select
        value={active}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 appearance-none rounded-md border border-border bg-background pl-8 pr-7 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        title="Ordenar"
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
