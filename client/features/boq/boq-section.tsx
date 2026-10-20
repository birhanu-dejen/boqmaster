"use client";

import { useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  BOQ_COLS,
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

/* ── Section header row ─────────────────────────────────────────── */

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
        "flex items-center gap-3 border-y bg-muted/50 py-2.5 pr-3",
        dragging && "opacity-40",
        dropPos === "before" && "shadow-[inset_0_2px_0_0_var(--color-primary)]",
        dropPos === "after" && "shadow-[inset_0_-2px_0_0_var(--color-primary)]",
      )}
      style={{ paddingLeft: 12 + depth * 24 }}
    >
      {/* Drag handle */}
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
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="size-4 shrink-0 text-muted-foreground" />
      </span>

      {/* Folder icon is the toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand section" : "Collapse section"}
        title={collapsed ? "Expand section" : "Collapse section"}
        className="shrink-0 rounded-sm p-0.5 text-primary hover:bg-muted"
      >
        <FolderIcon className="size-4" />
      </button>

      {/* State indicator only, not clickable */}
      <span aria-hidden="true" className="text-muted-foreground">
        {collapsed ? (
          <ChevronRight className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </span>

      <div className="w-20 shrink-0">
        <TextCell
          value={section.ordinal}
          onCommit={(v) => onChange({ ordinal: v })}
          className="font-mono text-xs font-semibold text-primary"
        />
      </div>
      <div className="min-w-32 max-w-sm flex-1">
        <TextCell
          value={section.title}
          placeholder="Section title"
          onCommit={(v) => onChange({ title: v })}
          className="text-sm font-semibold"
        />
      </div>
      <span className="text-sm font-semibold">{section.title}</span>
      <Badge variant="secondary" className="font-normal">
        {count} {count === 1 ? "item" : "items"}
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        {onAddSub && (
          <Button type="button" size="sm" variant="outline" onClick={onAddSub}>
            <Folder className="size-3.5" />
            Sub
          </Button>
        )}
        <Button type="button" size="sm" onClick={onAddPosition}>
          <Plus className="size-3.5" />
          Add Position
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Delete section"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="More actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
        <span className="w-10 text-right text-xs font-medium text-primary tabular-nums">
          {Math.round(percentOfTotal)}%
        </span>
        <span className="w-36 text-right text-sm font-semibold tabular-nums">
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}

/* ── Position row ───────────────────────────────────────────────── */

export function PositionRow({
  position,
  selected,
  onSelect,
  onChange,
  onDelete,
}: {
  position: BoqPosition;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onChange: (patch: PositionPatch) => void;
  onDelete: () => void;
}) {
  const priced = position.unitRate > 0;
  const incomplete = hasError(position);
  return (
    <div
      className={cn(
        "group grid items-center gap-2 border-b border-l-2 border-l-transparent px-3 py-1 text-sm hover:bg-muted/30",
        BOQ_COLS,
        selected && "bg-primary/5",
        !priced &&
          position.quantity > 0 &&
          "bg-amber-50/60 dark:bg-amber-500/5",
        incomplete && "border-l-destructive",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onSelect(v === true)}
        aria-label={`Select ${position.ordinal}`}
      />

      <div className="flex items-center gap-2">
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
                ? "bg-muted-foreground/40"
                : "bg-amber-500",
          )}
        />
      </div>

      <TextCell
        value={position.description}
        placeholder="Description"
        onCommit={(v) => onChange({ description: v })}
      />
      <TextCell
        value={position.unit}
        onCommit={(v) => onChange({ unit: v })}
        className="text-center font-mono text-xs"
      />
      <NumberCell
        value={position.quantity}
        onCommit={(v) => onChange({ quantity: v })}
      />
      <NumberCell
        value={position.unitRate}
        onCommit={(v) => onChange({ unitRate: v })}
      />

      <span className="px-1.5 text-right font-medium tabular-nums">
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
