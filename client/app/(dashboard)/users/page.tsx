import type { Metadata } from "next";

import { UsersTable } from "@/components/users-table";
import { getUsers } from "@/lib/api/users.server";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const result = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage who has access to BOQMaster.
        </p>
      </div>

      {result.status === "forbidden" ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          You need an admin account to view this page.
        </div>
      ) : (
        <UsersTable users={result.users} />
      )}
    </div>
  );
}
