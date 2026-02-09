"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  User,
  MapPin,
  Handshake,
  FileSpreadsheet,
  Settings,
  Search,
  ChevronRight,
  Plus,
} from "lucide-react";
import { TOKEN_MODULES, type TokenDefinition } from "@/lib/docs/token-registry";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Building2,
  User,
  MapPin,
  Handshake,
  FileSpreadsheet,
  Settings,
};

interface TokenPickerProps {
  onSelect: (token: {
    module: string;
    tokenKey: string;
    label: string;
  }) => void;
  filterModules?: string[];
}

export function TokenPicker({ onSelect, filterModules }: TokenPickerProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const modules = useMemo(() => {
    if (filterModules && filterModules.length > 0) {
      return TOKEN_MODULES.filter((m) => filterModules.includes(m.key));
    }
    return TOKEN_MODULES;
  }, [filterModules]);

  const filteredTokens = useMemo(() => {
    if (!selectedModule) return [];
    const mod = modules.find((m) => m.key === selectedModule);
    if (!mod) return [];
    if (!search) return mod.tokens;
    const q = search.toLowerCase();
    return mod.tokens.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q)
    );
  }, [selectedModule, search, modules]);

  const allFiltered = useMemo(() => {
    if (!search || selectedModule) return null;
    const q = search.toLowerCase();
    const results: (TokenDefinition & { moduleKey: string; moduleLabel: string })[] = [];
    for (const mod of modules) {
      for (const token of mod.tokens) {
        if (
          token.label.toLowerCase().includes(q) ||
          token.key.toLowerCase().includes(q)
        ) {
          results.push({ ...token, moduleKey: mod.key, moduleLabel: mod.label });
        }
      }
    }
    return results;
  }, [search, selectedModule, modules]);

  return (
    <div className="w-80 max-h-96 overflow-hidden flex flex-col">
      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {/* Global search results */}
        {allFiltered && allFiltered.length > 0 && (
          <div className="p-1">
            {allFiltered.map((token) => (
              <button
                key={token.key}
                type="button"
                onClick={() =>
                  onSelect({
                    module: token.moduleKey,
                    tokenKey: token.key,
                    label: token.label,
                  })
                }
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2"
              >
                <Plus className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium">{token.label}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">
                    {token.moduleLabel}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {allFiltered && allFiltered.length === 0 && search && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No se encontraron tokens
          </div>
        )}

        {/* Module list */}
        {!selectedModule && !search && (
          <div className="p-1">
            {modules.map((mod) => {
              const Icon = ICON_MAP[mod.icon] || Settings;
              return (
                <button
                  key={mod.key}
                  type="button"
                  onClick={() => setSelectedModule(mod.key)}
                  className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{mod.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {mod.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Module tokens */}
        {selectedModule && (
          <div>
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs"
                onClick={() => {
                  setSelectedModule(null);
                  setSearch("");
                }}
              >
                ← Volver
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                {modules.find((m) => m.key === selectedModule)?.label}
              </span>
            </div>
            <div className="p-1">
              {filteredTokens.map((token) => (
                <button
                  key={token.key}
                  type="button"
                  onClick={() =>
                    onSelect({
                      module: selectedModule,
                      tokenKey: token.key,
                      label: token.label,
                    })
                  }
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-mono border border-blue-200">
                    {`{{${token.label}}}`}
                  </span>
                </button>
              ))}
              {filteredTokens.length === 0 && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No se encontraron tokens
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
