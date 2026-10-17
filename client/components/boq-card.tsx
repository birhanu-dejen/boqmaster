import Link from "next/link";
import { CalendarDays, Copy, Table2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Boq } from "@/types/boq";

const statusStyles = {
  draft: {
    label: "Draft",
    dot: "bg-blue-500",
    text: "text-blue-700",
    accent: "border-l-amber-400",
  },
  final: {
    label: "Final",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    accent: "border-l-emerald-500",
  },
} as const;

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function BoqCard({
  boq,
  projectId,
  projectName,
}: {
  boq: Boq;
  projectId: string;
  projectName: string;
}) {
  const s = statusStyles[boq.status] ?? statusStyles.draft;
  const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-l-4 bg-card shadow-sm transition hover:shadow-md",
        s.accent,
      )}
    >
      <Link
        href={`/projects/${projectId}/boqs/${boq.id}`}
        className="flex-1 p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Table2 className="size-5" />
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium",
              s.text,
            )}
          >
            <span className={cn("size-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 font-semibold leading-snug">
          {boq.name}
        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {projectName}
        </p>
      </Link>

      <div className="border-t px-4 py-3">
        <p className="text-2xl font-bold tabular-nums">
          {money.format(boq.totalValue)}{" "}
          <span className="text-xs font-normal text-muted-foreground">
            {boq.currency}
          </span>
        </p>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{boq.positions} pos.</span>
          <span>·</span>
          <CalendarDays className="size-3.5" />
          <span>{formatDate(boq.updatedAt)}</span>
        </p>

        <div className="mt-3 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled
            title="Duplicate (coming soon)"
          >
            <Copy className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled
            title="Delete (coming soon)"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
