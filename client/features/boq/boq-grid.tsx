"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BOQ_COLS,
  formatMoney,
  grandTotal,
  initialSections,
  matchesFilter,
  nextPositionOrdinal,
  nextSectionOrdinal,
  sectionTotal,
  type BoqFilter,
  type BoqSection,
} from "@/lib/boq";
import { cn } from "@/lib/utils";
import { BoqToolbar } from "./boq-toolbar";
import { PositionRow, SectionRow, type PositionPatch } from "./boq-section";

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
  initial = initialSections,
}: {
  initial?: BoqSection[];
}) {
  const [sections, setSections] = useState<BoqSection[]>(initial);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Set<BoqFilter>>(new Set());

  const total = useMemo(() => grandTotal(sections), [sections]);
  const positionCount = useMemo(
    () => sections.reduce((n, s) => n + s.positions.length, 0),
    [sections],
  );

  /* Rows visible after search and filters. Sections with no match are hidden
     only while a search or filter is active. */
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const narrowing = q !== "" || filters.size > 0;
    return sections
      .map((section) => ({
        section,
        positions: section.positions.filter(
          (p) =>
            (q === "" ||
              p.description.toLowerCase().includes(q) ||
              p.ordinal.toLowerCase().includes(q)) &&
            [...filters].every((f) => matchesFilter(p, f)),
        ),
      }))
      .filter((v) => !narrowing || v.positions.length > 0);
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

  /* ── Mutations ───────────────────────────────────────────────── */

  const patchPosition = (
    sectionId: string,
    posId: string,
    patch: PositionPatch,
  ) =>
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
    );

  const addPosition = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              positions: [
                ...s.positions,
                {
                  id: crypto.randomUUID(),
                  ordinal: nextPositionOrdinal(s),
                  description: "",
                  unit: "m²",
                  quantity: 0,
                  unitRate: 0,
                },
              ],
            },
      ),
    );
    // make sure the new row is visible
    setCollapsed((prev) => {
      if (!prev.has(sectionId)) return prev;
      const n = new Set(prev);
      n.delete(sectionId);
      return n;
    });
  };

  const addSection = () =>
    setSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ordinal: nextSectionOrdinal(prev),
        title: "New section",
        positions: [],
      },
    ]);

  const deletePosition = (sectionId: string, posId: string) => {
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

  const deleteSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const count = section.positions.length;
    if (
      count > 0 &&
      !window.confirm(
        `Delete section ${section.ordinal} and its ${count} position${count === 1 ? "" : "s"}?`,
      )
    ) {
      return;
    }
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    setSelected((prev) => {
      const n = new Set(prev);
      section.positions.forEach((p) => n.delete(p.id));
      return n;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-stretch gap-3">
        <BoqToolbar
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
          className="flex min-w-52 shrink-0 flex-col justify-center gap-1 rounded-xl border bg-card px-4 py-2.5 shadow-xs"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              "grid items-center gap-2 border-b bg-muted/40 px-3 py-2.5 text-xs font-medium text-muted-foreground",
              BOQ_COLS,
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
                    RIGHT_ALIGNED.has(h)
                      ? "text-right"
                      : h === "Unit"
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
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {sections.length === 0
                ? 'No sections yet. Click "Add section" to start.'
                : "No positions match. Clear the search or filters to see all lines."}
            </p>
          ) : (
            visible.map(({ section, positions }) => {
              const isCollapsed = collapsed.has(section.id);
              return (
                <div key={section.id}>
                  <SectionRow
                    section={section}
                    collapsed={isCollapsed}
                    percentOfTotal={
                      total > 0 ? (sectionTotal(section) / total) * 100 : 0
                    }
                    onToggle={() =>
                      setCollapsed((prev) => toggleIn(prev, section.id))
                    }
                    onAddPosition={() => addPosition(section.id)}
                    onAddSub={() => {
                      /* Nested sections need a parentId on BoqSection. Add it when you wire the API. */
                    }}
                    onDelete={() => deleteSection(section.id)}
                  />
                  {!isCollapsed &&
                    positions.map((p) => (
                      <PositionRow
                        key={p.id}
                        position={p}
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
          <div className="flex items-center justify-between bg-muted/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {selected.size > 0 ? `${selected.size} selected` : "Direct cost"}
            </span>
            <span className="text-base font-semibold tabular-nums">
              {formatMoney(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
