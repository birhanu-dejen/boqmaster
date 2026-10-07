import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/project";

const config: Record<ProjectStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In progress", className: "bg-blue-100 text-blue-700" },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-700",
  },
  archived: { label: "Archived", className: "bg-amber-100 text-amber-700" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { label, className } = config[status];
  return (
    <Badge variant="outline" className={cn("border-transparent", className)}>
      {label}
    </Badge>
  );
}
