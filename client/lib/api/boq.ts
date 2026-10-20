import type { BoqPosition, BoqSection } from "@/lib/boq";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiPosition = {
  id: number;
  section_id: number;
  ordinal: string;
  description: string;
  unit: string;
  quantity: number;
  unit_rate: number;
};

export type ApiSection = {
  id: number;
  boq_id: number;
  parent_id: number | null;
  ordinal: string;
  title: string;
  positions: ApiPosition[];
};

export const mapPosition = (p: ApiPosition): BoqPosition => ({
  id: String(p.id),
  ordinal: p.ordinal,
  description: p.description,
  unit: p.unit,
  quantity: Number(p.quantity),
  unitRate: Number(p.unit_rate),
});

export const mapSection = (s: ApiSection): BoqSection => ({
  id: String(s.id),
  parentId: s.parent_id == null ? null : String(s.parent_id),
  ordinal: s.ordinal,
  title: s.title,
  positions: s.positions.map(mapPosition),
});

async function call<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const detail =
      typeof err?.detail === "string" ? err.detail : `status ${res.status}`;
    throw new Error(`Request failed: ${detail}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const boqApi = {
  addSection: async (
    boqId: string,
    input: { ordinal: string; title: string; parentId?: string | null },
  ) =>
    mapSection(
      await call<ApiSection>(`/boqs/${boqId}/sections`, "POST", {
        ordinal: input.ordinal,
        title: input.title,
        parent_id: input.parentId ? Number(input.parentId) : null,
      }),
    ),

  updateSection: (id: string, patch: { ordinal?: string; title?: string }) =>
    call<ApiSection>(`/sections/${id}`, "PATCH", patch),

  deleteSection: (id: string) => call<void>(`/sections/${id}`, "DELETE"),

  reorderSections: (
    boqId: string,
    items: { id: string; parentId: string | null }[],
  ) =>
    call<void>(`/boqs/${boqId}/sections/reorder`, "POST", {
      items: items.map((i) => ({
        id: Number(i.id),
        parent_id: i.parentId ? Number(i.parentId) : null,
      })),
    }),

  addPosition: async (sectionId: string, input: Omit<BoqPosition, "id">) =>
    mapPosition(
      await call<ApiPosition>(`/sections/${sectionId}/positions`, "POST", {
        ordinal: input.ordinal,
        description: input.description,
        unit: input.unit,
        quantity: input.quantity,
        unit_rate: input.unitRate,
      }),
    ),

  updatePosition: (id: string, patch: Partial<Omit<BoqPosition, "id">>) =>
    call<ApiPosition>(`/positions/${id}`, "PATCH", {
      ...(patch.ordinal !== undefined && { ordinal: patch.ordinal }),
      ...(patch.description !== undefined && {
        description: patch.description,
      }),
      ...(patch.unit !== undefined && { unit: patch.unit }),
      ...(patch.quantity !== undefined && { quantity: patch.quantity }),
      ...(patch.unitRate !== undefined && { unit_rate: patch.unitRate }),
    }),

  deletePosition: (id: string) => call<void>(`/positions/${id}`, "DELETE"),
};
