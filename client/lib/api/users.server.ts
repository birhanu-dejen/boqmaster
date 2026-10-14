import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:8000";

export type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type ApiUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type UsersResult =
  | { status: "ok"; users: User[] }
  | { status: "forbidden" };

export async function getUsers(): Promise<UsersResult> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  const res = await fetch(`${API_URL}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");
  if (res.status === 403) return { status: "forbidden" };
  if (!res.ok) throw new Error(`Failed to load users (${res.status})`);

  const data: ApiUser[] = await res.json();

  return {
    status: "ok",
    users: data.map((u) => ({
      id: u.id,
      fullName: u.full_name,
      email: u.email,
      role: u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
    })),
  };
}
