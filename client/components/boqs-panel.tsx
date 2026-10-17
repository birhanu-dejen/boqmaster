"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { BoqCard } from "@/components/boq-card";
import { NewBoqDialog } from "@/components/new-boq-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Boq } from "@/types/boq";

type Filter = "all" | "draft" | "final";

function Stat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-2xl font-bold">{children}</div>
    </div>
  );
}

export function BoqsPanel({
  boqs,
  projectId,
  projectName,
}: {
  boqs: Boq[];
  projectId: string;
  projectName: string;
}) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered = boqs.filter(
    (b) =>
      (filter === "all" || b.status === filter) &&
      b.name.toLowerCase().includes(query.toLowerCase()),
  );

  const drafts = boqs.filter((b) => b.status === "draft").length;
  const finals = boqs.filter((b) => b.status === "final").length;
  const positions = boqs.reduce((n, b) => n + b.positions, 0);
  const total = boqs.reduce((n, b) => n + b.totalValue, 0);
  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {boqs.length} {boqs.length === 1 ? "estimate" : "estimates"} in this
          project
        </p>
        <NewBoqDialog projectId={projectId} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Estimates">{boqs.length}</Stat>
        <Stat label="Total positions">{positions}</Stat>
        <Stat label="Total value">
          {compact.format(total)}{" "}
          <span className="text-xs font-normal text-muted-foreground">ETB</span>
        </Stat>
        <Stat label="Status">
          <div className="flex items-center gap-4 pt-1 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="size-1.5 rounded-full bg-blue-500" />
              {drafts} Draft
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {finals} Final
            </span>
          </div>
        </Stat>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search estimates..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(["all", "draft", "final"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1 text-sm capitalize transition",
                filter === f
                  ? "bg-background font-medium shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {f === "all" ? "All statuses" : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          {boqs.length === 0
            ? 'No bills of quantities yet. Click "New BOQ" to create one.'
            : "No estimates match your filters."}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <BoqCard
                key={b.id}
                boq={b}
                projectId={projectId}
                projectName={projectName}
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {filtered.length} of {boqs.length} estimates
          </p>
        </>
      )}
    </div>
  );
}
