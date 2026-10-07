export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  status: ProjectStatus;
  totalCost: number; // ETB
  updatedAt: string; // ISO date
}
export interface CreateProjectInput {
  name: string;
  client: string;
  location: string;
  description?: string;
}
