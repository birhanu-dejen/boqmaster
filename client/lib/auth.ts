const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "estimator" | "viewer";
  is_active: boolean;
};

export async function login(email: string, password: string) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
    });
  } catch {
    throw new Error("Cannot reach the server. Is the backend running?");
  }
  if (res.status === 401) throw new Error("Invalid email or password.");
  if (!res.ok) throw new Error("Something went wrong. Please try again.");
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
  });
  if (res.status === 401) window.location.href = "/";
  return res;
}

export async function getMe(): Promise<User | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function logout() {
  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
  window.location.href = "/";
}
