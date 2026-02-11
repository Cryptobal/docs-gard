"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface FilterOption {
  key: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface FilterPillsProps {
  options: FilterOption[];
  active: string;
  onChange: (key: string) => void;
}

export function FilterPills({ options, active, onChange }: FilterPillsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = active === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 border",
              isActive
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            <span className="flex items-center gap-1">
              {Icon && <Icon className="h-3 w-3" />}
              {opt.label}
              {opt.count !== undefined && ` (${opt.count})`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
