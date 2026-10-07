import type { Project } from "@/types/project";
import type { CreateProjectInput } from "@/types/project";
const mockProjects: Project[] = [
  {
    id: "1",
    name: "G+4 Commercial Building",
    client: "Abebe Trading PLC",
    location: "Bole, Addis Ababa",
    status: "in_progress",
    totalCost: 48_600_000,
    updatedAt: "2026-10-05T10:00:00Z",
  },
  {
    id: "2",
    name: "Residential Villa",
    client: "Ato Kebede Alemu",
    location: "Hawassa",
    status: "draft",
    totalCost: 12_300_000,
    updatedAt: "2026-10-03T08:30:00Z",
  },
  {
    id: "3",
    name: "Primary School Block",
    client: "Oromia Education Bureau",
    location: "Adama",
    status: "completed",
    totalCost: 21_750_000,
    updatedAt: "2026-09-20T14:15:00Z",
  },
  {
    id: "4",
    name: "Warehouse Complex",
    client: "Selam Logistics",
    location: "Dire Dawa",
    status: "archived",
    totalCost: 33_900_000,
    updatedAt: "2026-08-11T09:00:00Z",
  },
];

// TODO: replace the body with fetch(`${API_URL}/projects`) when NestJS is ready
export async function getProjects(): Promise<Project[]> {
  return mockProjects;
}

// TODO: replace with POST `${API_URL}/projects` when NestJS is ready
export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  await new Promise((r) => setTimeout(r, 800)); // simulate network
  return {
    id: crypto.randomUUID(),
    ...input,
    status: "draft",
    totalCost: 0,
    updatedAt: new Date().toISOString(),
  };
}
