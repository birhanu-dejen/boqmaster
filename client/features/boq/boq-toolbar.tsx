"use client";

import {
  AlertTriangle,
  Banknote,
  ChevronsDownUp,
  ChevronsUpDown,
  Hash,
  Layers,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BoqFilter } from "@/lib/boq";

const FILTERS: { key: BoqFilter; label: string; icon: typeof Hash }[] = [
  { key: "errors", label: "Errors", icon: AlertTriangle },
  { key: "noPrice", label: "No price", icon: Banknote },
  { key: "zeroQty", label: "Zero qty", icon: Hash },
];

export function BoqToolbar({
  search,
  onSearch,
  active,
  onToggle,
  shown,
  total,
  onClear,
  allCollapsed,
  onToggleCollapseAll,
  onAddSection,
}: {
  search: string;
  onSearch: (v: string) => void;
  active: Set<BoqFilter>;
  onToggle: (f: BoqFilter) => void;
  shown: number;
  total: number;
  onClear: () => void;
  allCollapsed: boolean;
  onToggleCollapseAll: () => void;
  onAddSection: () => void;
}) {
  const narrowing = search.trim() !== "" || active.size > 0;

  return (
    <section
      aria-label="Estimate toolbar"
      className="flex min-w-72 flex-1 flex-col gap-2 rounded-xl border bg-card px-3 py-2.5 shadow-xs"
    >
      {/* Row 1: build actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={onAddSection}>
          <Layers className="size-3.5" />
          Add section
        </Button>
      </div>

      {/* Row 2: search + filters */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-2">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search positions…"
            className="pl-8"
          />
        </div>
        {FILTERS.map(({ key, label, icon: Icon }) => {
          const on = active.has(key);
          return (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={on ? "default" : "outline"}
              aria-pressed={on}
              onClick={() => onToggle(key)}
              className={cn("rounded-full", !on && "text-muted-foreground")}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          );
        })}

        {narrowing && (
          <span className="ml-auto flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
            {shown} of {total}
            <button
              type="button"
              onClick={onClear}
              className="font-medium text-primary hover:underline"
            >
              Clear
            </button>
          </span>
        )}
      </div>
    </section>
  );
}
