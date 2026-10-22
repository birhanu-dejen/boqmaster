"use client";

import { useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  formatMoney,
  hasError,
  positionTotal,
  type BoqPosition,
  type BoqSection,
} from "@/lib/boq";
import { NumberCell, TextCell } from "./cells";

export type PositionPatch = Partial<
  Pick<
    BoqPosition,
    "ordinal" | "description" | "unit" | "quantity" | "unitRate"
  >
>;
export type SectionPatch = Partial<Pick<BoqSection, "ordinal" | "title">>;
export type DropPos = "before" | "after";

/** Shared 8-column grid for the header, section rows and position rows.
    The Pos. column is wide enough to show a full section name.
    checkbox | pos | description | unit | qty | rate | total | delete */
export const BOQ_GRID = "grid-cols-[2rem_20rem_1fr_5rem_8rem_8rem_9rem_2rem]";

/* ── Section header row ─────────────────────────────────────────────
   Uses the same 8-column grid as the column header and the position rows:
   grip | folder + ordinal (Pos.) | title + count (Description) |
   actions (Unit..Unit Rate) | total | delete */

export function SectionRow({
  section,
  depth = 0,
  onChange,
  collapsed,
  total,
  percentOfTotal,
  dragging = false,
  droppable = false,
  dropPos = null,
  onToggle,
  onAddPosition,
  onAddSub,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  section: BoqSection;
  depth?: number;
  collapsed: boolean;
  total: number;
  percentOfTotal: number;
  dragging?: boolean;
  onChange: (patch: SectionPatch) => void;
  droppable?: boolean;
  dropPos?: DropPos | null;
  onToggle: () => void;
  onAddPosition: () => void;
  onAddSub?: () => void;
  onDelete: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (pos: DropPos) => void;
  onDrop?: () => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const FolderIcon = collapsed ? Folder : FolderOpen;
  const count = section.positions.length;

  return (
    <div
      ref={rowRef}
      onDragOver={(e) => {
        if (!droppable) return;
        e.preventDefault(); // allow drop
        const rect = e.currentTarget.getBoundingClientRect();
        onDragOver?.(
          e.clientY < rect.top + rect.height / 2 ? "before" : "after",
        );
      }}
      onDrop={(e) => {
        if (!droppable) return;
        e.preventDefault();
        onDrop?.();
      }}
      className={cn(
        "group/section grid items-center gap-2 border-y border-l-2 bg-muted/60 px-3 py-0.5 transition-colors hover:bg-muted/80",
        BOQ_GRID,
        depth > 0 ? "border-l-primary" : "border-l-transparent",
        dragging && "opacity-40",
        dropPos === "before" && "shadow-[inset_0_2px_0_0_var(--color-primary)]",
        dropPos === "after" && "shadow-[inset_0_-2px_0_0_var(--color-primary)]",
      )}
    >
      {/* Col 1 · drag handle (sits under the select-all checkbox) */}
      <span
        draggable
        title="Drag to reorder"
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", section.id); // required by Firefox
          if (rowRef.current)
            e.dataTransfer.setDragImage(rowRef.current, 16, 16);
          onDragStart?.();
        }}
        onDragEnd={() => onDragEnd?.()}
        className="flex cursor-grab justify-center text-muted-foreground/60 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4 shrink-0" />
      </span>

      {/* Col 2 · Pos. — toggle, ordinal and section name (stays inside Pos.) */}
      <div
        className="flex min-w-0 items-center gap-1.5"
        style={{ paddingLeft: depth * 12 }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand section" : "Collapse section"}
          title={collapsed ? "Expand section" : "Collapse section"}
          className="flex shrink-0 items-center rounded-md p-1 text-primary transition-colors hover:bg-background"
        >
          <FolderIcon className="size-4" />
          {collapsed ? (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </button>
        <div className="w-14 shrink-0">
          <TextCell
            value={section.ordinal}
            onCommit={(v) => onChange({ ordinal: v })}
            className="font-mono text-xs font-semibold text-primary"
          />
        </div>
        <div className="min-w-0 flex-1">
          <TextCell
            value={section.title}
            placeholder="Section title"
            onCommit={(v) => onChange({ title: v })}
            className="text-sm font-semibold uppercase tracking-wide"
          />
        </div>
      </div>

      {/* Col 3 · Description — item count only */}
      <div className="flex min-w-0 items-center justify-center">
        <Badge
          variant="secondary"
          className="shrink-0 rounded-full px-2 text-[11px] font-normal text-muted-foreground"
        >
          {count} {count === 1 ? "item" : "items"}
        </Badge>
      </div>

      {/* Col 4 · Unit — share of grand total */}
      <span className="px-1.5 text-center text-xs font-medium text-primary tabular-nums">
        {Math.round(percentOfTotal)}%
      </span>

      {/* Col 5 · Quantity — section total */}
      <span className="px-1.5 text-right text-sm font-semibold tabular-nums">
        {formatMoney(total)}
      </span>

      {/* Col 6 · Unit Rate — Sub */}
      <div className="flex justify-end">
        {onAddSub && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onAddSub}
            className="h-7 gap-1 bg-background px-2 text-xs"
          >
            <Folder className="size-3" />
            Sub
          </Button>
        )}
      </div>

      {/* Col 7 · Total — Add Position (left-aligned, hugging Sub) */}
      <div className="flex justify-start">
        <Button
          type="button"
          size="sm"
          onClick={onAddPosition}
          className="h-5 gap-1 px-1.5 text-xs"
        >
          <Plus className="size-3" />
          Add Position
        </Button>
      </div>

      {/* Col 8 · Delete */}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Delete section"
        onClick={onDelete}
        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/section:opacity-100"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

/* ── Position row ───────────────────────────────────────────────── */

export function PositionRow({
  position,
  depth = 0,
  selected,
  onSelect,
  onChange,
  onDelete,
}: {
  position: BoqPosition;
  depth?: number;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onChange: (patch: PositionPatch) => void;
  onDelete: () => void;
}) {
  const priced = position.unitRate > 0;
  const incomplete = hasError(position);
  const zeroTotal = positionTotal(position) === 0;

  return (
    <div
      className={cn(
        "group grid items-center gap-2 border-b border-l-2 px-3 py-1 text-sm transition-colors hover:bg-muted/40",
        BOQ_GRID,
        // left status bar: red = incomplete, amber = unpriced, none = fine
        incomplete
          ? "border-l-destructive"
          : !priced
            ? "border-l-amber-400"
            : "border-l-transparent",
        !priced &&
          !incomplete &&
          position.quantity > 0 &&
          "bg-amber-50/60 dark:bg-amber-500/5",
        selected && "bg-primary/5 hover:bg-primary/10",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onSelect(v === true)}
        aria-label={`Select ${position.ordinal}`}
      />

      <div
        className="flex items-center gap-2"
        style={{ paddingLeft: depth * 12 }}
      >
        <TextCell
          value={position.ordinal}
          onCommit={(v) => onChange({ ordinal: v })}
          className="font-mono text-xs"
        />
        <span
          title={
            incomplete ? "Incomplete line" : priced ? "Priced" : "No price"
          }
          className={cn(
            "size-2 shrink-0 rounded-full",
            incomplete
              ? "bg-destructive"
              : priced
                ? "bg-emerald-500/70"
                : "bg-amber-500",
          )}
        />
      </div>

      <TextCell
        value={position.description}
        placeholder="Description"
        onCommit={(v) => onChange({ description: v })}
        className="text-center"
      />
      <TextCell
        value={position.unit}
        onCommit={(v) => onChange({ unit: v })}
        className="text-center font-mono text-xs text-muted-foreground"
      />
      <NumberCell
        value={position.quantity}
        onCommit={(v) => onChange({ quantity: v })}
      />
      <NumberCell
        value={position.unitRate}
        onCommit={(v) => onChange({ unitRate: v })}
      />

      <span
        className={cn(
          "px-1.5 text-right font-medium tabular-nums",
          zeroTotal && "text-muted-foreground",
        )}
      >
        {formatMoney(positionTotal(position))}
      </span>

      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Delete position"
        onClick={onDelete}
        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
