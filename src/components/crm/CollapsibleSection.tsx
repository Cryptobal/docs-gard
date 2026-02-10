"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

interface CollapsibleSectionProps {
  icon?: React.ReactNode;
  title: string;
  count?: number;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({
  icon,
  title,
  count,
  defaultOpen = true,
  action,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-primary transition-colors -ml-0.5 group"
          >
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
            )}
            <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
              {icon}
              {title}
              {count !== undefined && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  ({count})
                </span>
              )}
            </CardTitle>
          </button>
          {action && <div className="shrink-0 flex items-center">{action}</div>}
        </div>
      </CardHeader>
      {open && <CardContent className="pt-4">{children}</CardContent>}
    </Card>
  );
}
