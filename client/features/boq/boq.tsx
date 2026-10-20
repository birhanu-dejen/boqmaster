export type BoqFilter = "errors" | "noPrice" | "zeroQty";

export type BoqPosition = {
  id: string;
  ordinal: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
};

export type BoqSection = {
  id: string;
  parentId?: string | null;
  ordinal: string;
  title: string;
  positions: BoqPosition[];
};

/* Grid template shared by the header and every position row (8 columns):
   checkbox | pos | description | unit | qty | rate | total | delete */
export const BOQ_COLS = "grid-cols-[2rem_9rem_1fr_4rem_7rem_7rem_9rem_2rem]";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export const formatMoney = (n: number) => money.format(n);

export const positionTotal = (p: BoqPosition) => p.quantity * p.unitRate;

/** Total of this section's own positions only (not its sub-sections). */
export const sectionTotal = (s: BoqSection) =>
  s.positions.reduce((sum, p) => sum + positionTotal(p), 0);

/** Sums every section's own positions, so nothing is counted twice. */
export const grandTotal = (sections: BoqSection[]) =>
  sections.reduce((sum, s) => sum + sectionTotal(s), 0);

export const hasError = (p: BoqPosition) =>
  p.description.trim() === "" || p.unit.trim() === "" || p.quantity < 0;

export function matchesFilter(p: BoqPosition, f: BoqFilter): boolean {
  switch (f) {
    case "errors":
      return hasError(p);
    case "noPrice":
      return p.unitRate <= 0;
    case "zeroQty":
      return p.quantity === 0;
  }
}

export const initialSections: BoqSection[] = [
  {
    id: "s1",
    ordinal: "01",
    title: "Substructure",
    positions: [
      {
        id: "p1",
        ordinal: "01.01.0010",
        description: "Excavation for foundations",
        unit: "m³",
        quantity: 120,
        unitRate: 450,
      },
      {
        id: "p2",
        ordinal: "01.01.0020",
        description: "Reinforced concrete C25/30",
        unit: "m³",
        quantity: 45,
        unitRate: 6200,
      },
    ],
  },
  {
    id: "s2",
    ordinal: "02",
    title: "Superstructure",
    positions: [
      {
        id: "p3",
        ordinal: "02.01.0010",
        description: "Hollow block walls 200mm",
        unit: "m²",
        quantity: 0,
        unitRate: 0,
      },
    ],
  },
];

/** Next free position ordinal: highest trailing number + 10, never a duplicate. */
export function nextPositionOrdinal(section: BoqSection): string {
  let max = 0;
  for (const p of section.positions) {
    const last = Number(p.ordinal.split(".").pop());
    if (Number.isFinite(last)) max = Math.max(max, last);
  }
  return `${section.ordinal}.01.${String(max + 10).padStart(4, "0")}`;
}

/** Next free top-level section ordinal ("01", "02", ...). */
export function nextSectionOrdinal(sections: BoqSection[]): string {
  const top = sections.filter((s) => !s.parentId);
  const used = new Set(top.map((s) => s.ordinal));
  let n = Math.max(0, ...top.map((s) => parseInt(s.ordinal, 10) || 0)) + 1;
  while (used.has(String(n).padStart(2, "0"))) n++;
  return String(n).padStart(2, "0");
}

/* ── Sub-section helpers ─────────────────────────────────────── */

/** Direct children of a section, in array order. */
export const childrenOf = (all: BoqSection[], id: string) =>
  all.filter((s) => s.parentId === id);

/** The section's id plus the ids of all its descendants. */
export function subtreeIds(all: BoqSection[], id: string): string[] {
  return [id, ...childrenOf(all, id).flatMap((c) => subtreeIds(all, c.id))];
}

/** Total of a section including every nested sub-section. */
export function subtreeTotal(all: BoqSection[], id: string): number {
  const ids = new Set(subtreeIds(all, id));
  return all
    .filter((s) => ids.has(s.id))
    .reduce((n, s) => n + sectionTotal(s), 0);
}

/** Depth-first order so each sub-section sits under its parent. */
export function flattenSections(
  all: BoqSection[],
  parentId: string | null = null,
  depth = 0,
): { section: BoqSection; depth: number }[] {
  return all
    .filter((s) => (s.parentId ?? null) === parentId)
    .flatMap((s) => [
      { section: s, depth },
      ...flattenSections(all, s.id, depth + 1),
    ]);
}

export function hasCollapsedAncestor(
  all: BoqSection[],
  s: BoqSection,
  collapsed: Set<string>,
): boolean {
  let p = s.parentId ? all.find((x) => x.id === s.parentId) : undefined;
  while (p) {
    if (collapsed.has(p.id)) return true;
    const pid: string | null | undefined = p.parentId;
    p = pid ? all.find((x) => x.id === pid) : undefined;
  }
  return false;
}

/** Next sub-section ordinal under a parent: "01" -> "01.01", "01.02", ... */
export function nextSubOrdinal(all: BoqSection[], parent: BoqSection): string {
  let max = 0;
  for (const c of childrenOf(all, parent.id)) {
    const last = Number(c.ordinal.split(".").pop());
    if (Number.isFinite(last)) max = Math.max(max, last);
  }
  return `${parent.ordinal}.${String(max + 1).padStart(2, "0")}`;
}

/** Parses "1.234,56", "1,234.56", "1 234,56", "12,5". Returns NaN if unreadable. */
export function parseNumber(raw: string): number {
  let s = raw.replace(/[^\d.,-]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    s =
      lastComma > lastDot
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const [head, tail = ""] = s.split(",");
    const isThousands =
      s.split(",").length === 2 && tail.length === 3 && head.length <= 3;
    s = isThousands ? s.replace(",", "") : s.replace(",", ".");
  }
  return s === "" ? NaN : Number(s);
}
/** Moves a section (with its subtree) before/after a target section.
    The moved section takes the target's parent, so this also re-parents. */
export function moveSection(
  all: BoqSection[],
  dragId: string,
  targetId: string,
  pos: "before" | "after",
): BoqSection[] {
  if (dragId === targetId) return all;
  if (subtreeIds(all, dragId).includes(targetId)) return all; // no drop into own subtree
  const drag = all.find((s) => s.id === dragId);
  const target = all.find((s) => s.id === targetId);
  if (!drag || !target) return all;

  const moved: BoqSection = { ...drag, parentId: target.parentId ?? null };
  const rest = all.filter((s) => s.id !== dragId);
  const idx = rest.findIndex((s) => s.id === targetId);
  const at = pos === "before" ? idx : idx + 1;
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}
