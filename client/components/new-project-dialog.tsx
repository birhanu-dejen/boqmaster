"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/lib/api/projects";

type Errors = Partial<Record<"name" | "client" | "location", string>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Errors>({});

  function handleOpenChange(next: boolean) {
    if (isLoading) return; // don't close while saving
    setOpen(next);
    if (!next) {
      setError(null);
      setErrors({});
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const client = String(data.get("client") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();

    const nextErrors: Errors = {};
    if (name.length < 3)
      nextErrors.name = "Project name must be at least 3 characters.";
    if (!client) nextErrors.client = "Client name is required.";
    if (!location) nextErrors.location = "Location is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      await createProject({ name, client, location, description });
      form.reset();
      setOpen(false);
      router.refresh(); // reload the projects list
    } catch {
      setError("Could not create the project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 size-4" />
        New project
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Enter the basic details. You can add BOQ items after creating it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. G+4 Commercial Building"
                disabled={isLoading}
                aria-invalid={!!errors.name}
              />
              <FieldError message={errors.name} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  name="client"
                  placeholder="Client or company"
                  disabled={isLoading}
                  aria-invalid={!!errors.client}
                />
                <FieldError message={errors.client} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g. Bole, Addis Ababa"
                  disabled={isLoading}
                  aria-invalid={!!errors.location}
                />
                <FieldError message={errors.location} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Short summary of the building and scope of work"
                disabled={isLoading}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
