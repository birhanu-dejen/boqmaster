export type ProjectStatus = "draft" | "in_progress" | "completed" | "archived";

export type Project = {
  id: string;
  name: string;
  client: string;
  location: string;
  description: string;
  status: ProjectStatus;

  createdAt: string;
  updatedAt: string;
};
export interface CreateProjectInput {
  name: string;
  client: string;
  location: string;
  description?: string;
}
