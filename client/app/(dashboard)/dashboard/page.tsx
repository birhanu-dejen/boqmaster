import type { Metadata } from "next";
import { FolderKanban, ListChecks, Wallet, FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

// TODO: replace with real numbers from the API
const stats = [
  { title: "Active projects", value: "12", icon: FolderKanban },
  { title: "BOQ items", value: "1,248", icon: ListChecks },
  { title: "Total estimated cost", value: "ETB 48.6M", icon: Wallet },
  { title: "Reports generated", value: "34", icon: FileText },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your projects and estimates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{s.title}</CardDescription>
              <s.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent projects</CardTitle>
          <CardDescription>
            Your latest projects will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No projects yet.
        </CardContent>
      </Card>
    </div>
  );
}
