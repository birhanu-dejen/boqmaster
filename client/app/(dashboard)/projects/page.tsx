import type { Metadata } from "next";

import { NewProjectDialog } from "@/components/new-project-dialog";
import { ProjectsTable } from "@/components/projects-table";
import { getProjects } from "@/lib/api/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your construction projects and estimates.
          </p>
        </div>
        <NewProjectDialog />
      </div>

      <ProjectsTable projects={projects} />
    </div>
  );
}
