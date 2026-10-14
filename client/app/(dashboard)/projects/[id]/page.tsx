import type { Metadata } from "next";
import { CalendarDays, MapPin, User } from "lucide-react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProject } from "@/lib/api/projects.server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  return { title: project.name };
}

function formatDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <Icon className="mt-0.5 size-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "-"}</p>
      </div>
    </div>
  );
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created {formatDate(project.createdAt)} · Updated{" "}
            {formatDate(project.updatedAt)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="boqs">BOQs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Detail icon={User} label="Client" value={project.client} />
            <Detail icon={MapPin} label="Location" value={project.location} />
            <Detail
              icon={CalendarDays}
              label="Last updated"
              value={formatDate(project.updatedAt)}
            />
          </div>

          <div className="rounded-lg border p-4">
            <p className="mb-1 text-xs text-muted-foreground">Description</p>
            <p className="whitespace-pre-wrap text-sm">
              {project.description || "No description provided."}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="boqs">
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
            <p className="text-sm font-medium">No bills of quantities yet</p>
            <p className="text-sm text-muted-foreground">
              BOQs you create for this project will appear here.
            </p>
            <Button disabled>New BOQ</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
