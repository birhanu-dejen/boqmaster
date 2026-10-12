const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type CreateProjectInput = {
  name: string;
  client: string;
  location: string;
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

function authHeaders(): HeadersInit {
  // Use the same place your login page stores the JWT
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to create project (${res.status})`);
  return res.json();
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_URL}/projects`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load projects (${res.status})`);
  return res.json();
}
