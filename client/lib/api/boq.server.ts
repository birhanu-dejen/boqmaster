import { notFound } from "next/navigation";
import { authedFetch } from "@/lib/api/projects.server";
import { mapSection, type ApiSection } from "@/lib/api/boq";

export async function getBoqDetail(boqId: string) {
  const res = await authedFetch(`/boqs/${encodeURIComponent(boqId)}`);
  if (res.status === 404 || res.status === 422) notFound();
  if (!res.ok) throw new Error(`Failed to load BOQ (${res.status})`);

  const data: {
    id: number;
    project_id: number;
    name: string;
    sections: ApiSection[];
  } = await res.json();

  return {
    id: String(data.id),
    projectId: String(data.project_id),
    name: data.name,
    sections: data.sections.map(mapSection),
  };
}