import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Project } from "@/types/project";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

type ApiProject = {
  id: number;
  name: string;
  client_name: string | null;
  location: string | null;
  description: string | null;
  status: Project["status"];
  owner_id: number;
  created_at: string;
  updated_at: string;
};

function mapProject(p: ApiProject): Project {
  return {
    id: String(p.id),
    name: p.name,
    client: p.client_name ?? "",
    location: p.location ?? "",
    description: p.description ?? "",
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

async function authedFetch(path: string) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");
  return res;
}

export async function getProjects(): Promise<Project[]> {
  const res = await authedFetch("/projects");
  if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);

  const data: ApiProject[] = await res.json();
  return data.map(mapProject);
}

export async function getProject(id: string): Promise<Project> {
  const res = await authedFetch(`/projects/${encodeURIComponent(id)}`);
  if (res.status === 404 || res.status === 422) notFound();
  if (!res.ok) throw new Error(`Failed to load project (${res.status})`);

  return mapProject(await res.json());
}
