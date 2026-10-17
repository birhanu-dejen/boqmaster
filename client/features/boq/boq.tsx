export type BoqPosition = {
  id: string;
  ordinal: string; // e.g. "01.01.0010"
  description: string;
  unit: string; // m², m³, kg ...
  quantity: number;
  unitRate: number;
};

export type BoqSection = {
  id: string;
  ordinal: string; // e.g. "01"
  title: string;
  positions: BoqPosition[];
};

export type BoqFilter = "errors" | "noPrice" | "zeroQty";

export const CURRENCY = "ETB";

/** Column template shared by the header row and every position row. */
export const BOQ_COLS =
  "grid-cols-[2.5rem_9rem_minmax(14rem,1fr)_4.5rem_8rem_7rem_9rem_2.5rem]";

const numberFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatNumber = (v: number) => numberFmt.format(v);
export const formatMoney = (v: number) => `${CURRENCY} ${numberFmt.format(v)}`;

export const positionTotal = (p: BoqPosition) => p.quantity * p.unitRate;
export const sectionTotal = (s: BoqSection) =>
  s.positions.reduce((sum, p) => sum + positionTotal(p), 0);
export const grandTotal = (sections: BoqSection[]) =>
  sections.reduce((sum, s) => sum + sectionTotal(s), 0);

/** A line is "in error" when it is incomplete. */
export const hasError = (p: BoqPosition) =>
  p.description.trim() === "" || p.unit.trim() === "";

export const matchesFilter = (p: BoqPosition, f: BoqFilter) =>
  f === "errors"
    ? hasError(p)
    : f === "noPrice"
      ? p.unitRate === 0
      : p.quantity === 0;

export const initialSections: BoqSection[] = [
  {
    id: "s1",
    ordinal: "01",
    title: "EARTHWORK & FOUNDATIONS",
    positions: [
      {
        id: "p1",
        ordinal: "01.01.0010",
        description: "Site clearing and grubbing",
        unit: "m²",
        quantity: 1000,
        unitRate: 8.5,
      },
      {
        id: "p2",
        ordinal: "01.01.0020",
        description: "Excavation to formation level",
        unit: "m³",
        quantity: 800,
        unitRate: 12.5,
      },
      {
        id: "p3",
        ordinal: "01.01.0030",
        description: "Backfill and compaction",
        unit: "m³",
        quantity: 300,
        unitRate: 15,
      },
      {
        id: "p4",
        ordinal: "01.02.0010",
        description: "Reinforced concrete strip foundations",
        unit: "m³",
        quantity: 150,
        unitRate: 285,
      },
      {
        id: "p5",
        ordinal: "01.02.0020",
        description: "Ground floor slab, RC C30/37, d=250mm",
        unit: "m²",
        quantity: 1000,
        unitRate: 95,
      },
    ],
  },
  {
    id: "s2",
    ordinal: "02",
    title: "STRUCTURAL FRAME",
    positions: [
      {
        id: "p6",
        ordinal: "02.01.0010",
        description: "Reinforced concrete columns",
        unit: "m³",
        quantity: 120,
        unitRate: 310,
      },
      {
        id: "p7",
        ordinal: "02.01.0020",
        description: "Reinforcement steel, Grade 60",
        unit: "kg",
        quantity: 18000,
        unitRate: 1.9,
      },
    ],
  },
  {
    id: "s3",
    ordinal: "03",
    title: "EXTERNAL WALLS & FACADE",
    positions: [
      {
        id: "p8",
        ordinal: "03.01.0010",
        description: "Hollow concrete block wall, 200mm",
        unit: "m²",
        quantity: 900,
        unitRate: 24,
      },
    ],
  },
];
