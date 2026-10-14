const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type CreateProjectInput = {
  name: string;
  client: string;
  location: string;
  description?: string;
};

export type CreateBoqInput = {
  name: string;
  description?: string;
};

export type Project = {
  id: number;
  name: string;
  client_name: string | null;
  location: string | null;
  description: string | null;
  status: string;
  owner_id: number;
  created_at: string;
};

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // browser sends the httpOnly cookie
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const detail =
      typeof err?.detail === "string" ? err.detail : `status ${res.status}`;
    throw new Error(`Failed to create project: ${detail}`);
  }
  return res.json();
}

export async function createBoq(projectId: string, input: CreateBoqInput) {
  const res = await fetch(
    `${API_URL}/projects/${encodeURIComponent(projectId)}/boqs`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const detail =
      typeof err?.detail === "string" ? err.detail : `status ${res.status}`;
    throw new Error(`Failed to create BOQ: ${detail}`);
  }
  return res.json();
}
