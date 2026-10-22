"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { boqApi } from "@/lib/api/boq";
import {
  flattenSections,
  formatMoney,
  grandTotal,
  hasCollapsedAncestor,
  matchesFilter,
  moveSection,
  nextPositionOrdinal,
  nextSectionOrdinal,
  nextSubOrdinal,
  subtreeIds,
  subtreeTotal,
  type BoqFilter,
  type BoqSection,
} from "@/lib/boq";
import { cn } from "@/lib/utils";
import { BoqToolbar } from "./boq-toolbar";
import {
  BOQ_GRID,
  PositionRow,
  SectionRow,
  type PositionPatch,
  type SectionPatch,
} from "./boq-section";
const HEADERS = [
  "",
  "Pos.",
  "Description",
  "Unit",
  "Quantity",
  "Unit Rate",
  "Total",
  "",
];
const RIGHT_ALIGNED = new Set(["Quantity", "Unit Rate", "Total"]);

function toggleIn<T>(set: Set<T>, v: T): Set<T> {
  const n = new Set(set);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
}

export function BoqGrid({
  boqId,
  initial,
}: {
  boqId: string;
  initial: BoqSection[];
}) {
  const [sections, setSections] = useState<BoqSection[]>(initial);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Set<BoqFilter>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // drag and drop
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{
    id: string;
    pos: "before" | "after";
  } | null>(null);

  const total = useMemo(() => grandTotal(sections), [sections]);
  const positionCount = useMemo(
    () => sections.reduce((n, s) => n + s.positions.length, 0),
    [sections],
  );

  /* Rows in tree order (sub-sections under their parent), after search and
     filters. While narrowing, sections with no match are hidden, but the
     ancestors of a matching sub-section stay visible. */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const narrowing = q !== "" || filters.size > 0;
    const byId = new Map(sections.map((s) => [s.id, s]));

    const rows = flattenSections(sections).map(({ section, depth }) => ({
      section,
      depth,
      positions: section.positions.filter(
        (p) =>
          (q === "" ||
            p.description.toLowerCase().includes(q) ||
            p.ordinal.toLowerCase().includes(q)) &&
          [...filters].every((f) => matchesFilter(p, f)),
      ),
    }));
    if (!narrowing) return rows;

    const keep = new Set<string>();
    for (const r of rows) {
      if (r.positions.length === 0) continue;
      let s: BoqSection | undefined = r.section;
      while (s) {
        keep.add(s.id);
        s = s.parentId ? byId.get(s.parentId) : undefined;
      }
    }
    return rows.filter((r) => keep.has(r.section.id));
  }, [sections, search, filters]);

  const visibleIds = useMemo(
    () => visible.flatMap((v) => v.positions.map((p) => p.id)),
    [visible],
  );
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someSelected = visibleIds.some((id) => selected.has(id));

  const allCollapsed =
    sections.length > 0 && sections.every((s) => collapsed.has(s.id));

  /* ── Server calls ────────────────────────────────────────────── */

  /** Runs an API call; on failure shows the message instead of throwing. */
  async function attempt<T>(
    fn: () => Promise<T>,
  ): Promise<{ ok: true; data: T } | { ok: false }> {
    setError(null);
    try {
      return { ok: true, data: await fn() };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return { ok: false };
    }
  }

  /* ── Mutations ───────────────────────────────────────────────── */

  const expand = (sectionId: string) =>
    setCollapsed((prev) => {
      if (!prev.has(sectionId)) return prev;
      const n = new Set(prev);
      n.delete(sectionId);
      return n;
    });

  const patchPosition = async (
    sectionId: string,
    posId: string,
    patch: PositionPatch,
  ) => {
    const before = sections;
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              positions: s.positions.map((p) =>
                p.id === posId ? { ...p, ...patch } : p,
              ),
            },
      ),
    ); // instant update
    const r = await attempt(() => boqApi.updatePosition(posId, patch));
    if (!r.ok) setSections(before); // roll back if the server refused
  };
  const patchSection = async (sectionId: string, patch: SectionPatch) => {
    const before = sections;
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
    );
    const r = await attempt(() => boqApi.updateSection(sectionId, patch));
    if (!r.ok) setSections(before);
  };
  const addPosition = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const r = await attempt(() =>
      boqApi.addPosition(sectionId, {
        ordinal: nextPositionOrdinal(section),
        description: "",
        unit: "m²",
        quantity: 0,
        unitRate: 0,
      }),
    );
    if (!r.ok) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, positions: [...s.positions, r.data] } : s,
      ),
    );
    expand(sectionId); // make sure the new row is visible
  };

  const addSection = async () => {
    const r = await attempt(() =>
      boqApi.addSection(boqId, {
        ordinal: nextSectionOrdinal(sections),
        title: "New section",
        parentId: null,
      }),
    );
    if (r.ok) setSections((prev) => [...prev, r.data]);
  };

  const addSub = async (parentId: string) => {
    const parent = sections.find((s) => s.id === parentId);
    if (!parent) return;
    const r = await attempt(() =>
      boqApi.addSection(boqId, {
        ordinal: nextSubOrdinal(sections, parent),
        title: "New sub-section",
        parentId,
      }),
    );
    if (!r.ok) return;
    setSections((prev) => [...prev, r.data]);
    expand(parentId); // make sure the new sub-section is visible
  };

  const deletePosition = async (sectionId: string, posId: string) => {
    const r = await attempt(() => boqApi.deletePosition(posId));
    if (!r.ok) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, positions: s.positions.filter((p) => p.id !== posId) }
          : s,
      ),
    );
    setSelected((prev) => {
      const n = new Set(prev);
      n.delete(posId);
      return n;
    });
  };

  const deleteSection = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const ids = new Set(subtreeIds(sections, sectionId));
    const doomed = sections.filter((s) => ids.has(s.id));
    const count = doomed.reduce((n, s) => n + s.positions.length, 0);
    const subs = doomed.length - 1;
    if (
      (count > 0 || subs > 0) &&
      !window.confirm(
        `Delete section ${section.ordinal}, ${subs} sub-section${subs === 1 ? "" : "s"} and ${count} position${count === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }
    const r = await attempt(() => boqApi.deleteSection(sectionId)); // server deletes the subtree
    if (!r.ok) return;
    setSections((prev) => prev.filter((s) => !ids.has(s.id)));
    setSelected((prev) => {
      const n = new Set(prev);
      doomed.forEach((s) => s.positions.forEach((p) => n.delete(p.id)));
      return n;
    });
  };

  const endDrag = () => {
    setDragId(null);
    setOver(null);
  };

  const handleDrop = async () => {
    if (!dragId || !over) {
      endDrag();
      return;
    }
    const before = sections;
    const next = moveSection(sections, dragId, over.id, over.pos);
    endDrag();
    if (next === before) return;
    setSections(next);
    const r = await attempt(() =>
      boqApi.reorderSections(
        boqId,
        next.map((s) => ({ id: s.id, parentId: s.parentId ?? null })),
      ),
    );
    if (!r.ok) setSections(before);
  };

  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-stretch gap-3">
        <BoqToolbar
          boqId={String(boqId)}
          boqName="boq"
          search={search}
          onSearch={setSearch}
          active={filters}
          onToggle={(f) => setFilters((prev) => toggleIn(prev, f))}
          shown={visibleIds.length}
          total={positionCount}
          onClear={() => {
            setSearch("");
            setFilters(new Set());
          }}
          allCollapsed={allCollapsed}
          onToggleCollapseAll={() =>
            setCollapsed(
              allCollapsed ? new Set() : new Set(sections.map((s) => s.id)),
            )
          }
          onAddSection={addSection}
        />

        {/* Grand total card */}
        <section
          aria-label="Grand total"
          className="flex min-w-56 shrink-0 flex-col justify-center gap-1 rounded-xl border bg-card px-5 py-3 shadow-xs"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Grand total
          </span>
          <span className="text-2xl font-bold leading-none tabular-nums">
            {formatMoney(total)}
          </span>
          <span className="text-xs text-muted-foreground">
            {sections.length} sections · {positionCount} positions
          </span>
        </section>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
        <div className="min-w-[56rem]">
          {/* Column header */}
          <div
            className={cn(
              "sticky top-0 z-10 grid items-center gap-2 border-b border-l-2 border-l-transparent bg-muted/70 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur",
              BOQ_GRID,
            )}
          >
            {HEADERS.map((h, i) =>
              i === 0 ? (
                <Checkbox
                  key={i}
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onCheckedChange={(v) =>
                    setSelected(v === true ? new Set(visibleIds) : new Set())
                  }
                  aria-label="Select all visible positions"
                />
              ) : (
                <span
                  key={i}
                  className={cn(
                    "px-1.5",
                    RIGHT_ALIGNED.has(h)
                      ? "text-right"
                      : h === "Unit" || h === "Description"
                        ? "text-center"
                        : "",
                  )}
                >
                  {h}
                </span>
              ),
            )}
          </div>

          {/* Body */}
          {visible.length === 0 ? (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">
              {sections.length === 0
                ? 'No sections yet. Click "Add section" to start.'
                : "No positions match. Clear the search or filters to see all lines."}
            </p>
          ) : (
            visible.map(({ section, depth, positions }) => {
              if (hasCollapsedAncestor(sections, section, collapsed))
                return null;
              const isCollapsed = collapsed.has(section.id);
              const sTotal = subtreeTotal(sections, section.id);
              return (
                <div key={section.id}>
                  <SectionRow
                    section={section}
                    depth={depth}
                    onChange={(patch) => patchSection(section.id, patch)}
                    collapsed={isCollapsed}
                    total={sTotal}
                    percentOfTotal={total > 0 ? (sTotal / total) * 100 : 0}
                    dragging={dragId === section.id}
                    droppable={
                      dragId !== null &&
                      !subtreeIds(sections, dragId).includes(section.id)
                    }
                    dropPos={over?.id === section.id ? over.pos : null}
                    onToggle={() =>
                      setCollapsed((prev) => toggleIn(prev, section.id))
                    }
                    onAddPosition={() => addPosition(section.id)}
                    onAddSub={() => addSub(section.id)}
                    onDelete={() => deleteSection(section.id)}
                    onDragStart={() => setDragId(section.id)}
                    onDragEnd={endDrag}
                    onDragOver={(pos) =>
                      setOver((o) =>
                        o?.id === section.id && o.pos === pos
                          ? o
                          : { id: section.id, pos },
                      )
                    }
                    onDrop={handleDrop}
                  />
                  {!isCollapsed &&
                    positions.map((p) => (
                      <PositionRow
                        key={p.id}
                        position={p}
                        depth={depth}
                        selected={selected.has(p.id)}
                        onSelect={(checked) =>
                          setSelected((prev) => {
                            const n = new Set(prev);
                            if (checked) n.add(p.id);
                            else n.delete(p.id);
                            return n;
                          })
                        }
                        onChange={(patch) =>
                          patchPosition(section.id, p.id, patch)
                        }
                        onDelete={() => deletePosition(section.id, p.id)}
                      />
                    ))}
                </div>
              );
            })
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t-2 bg-muted/60 px-4 py-3 text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selected` : "Direct cost"}
            </span>
            <span className="text-base font-bold tabular-nums">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
