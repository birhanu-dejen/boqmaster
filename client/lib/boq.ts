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

export const sectionTotal = (s: BoqSection) =>
  s.positions.reduce((sum, p) => sum + positionTotal(p), 0);

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
  const used = new Set(sections.map((s) => s.ordinal));
  let n = Math.max(0, ...sections.map((s) => parseInt(s.ordinal, 10) || 0)) + 1;
  while (used.has(String(n).padStart(2, "0"))) n++;
  return String(n).padStart(2, "0");
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
