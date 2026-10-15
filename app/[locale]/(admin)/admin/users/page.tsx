import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";

import { requireAdmin } from "@/lib/session";
import { listAdminUsers } from "@/lib/queries/admin";
import { AdminUserActions } from "@/components/features/admin/admin-user-actions";
import { EmptyState } from "@/components/features/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export async function generateMetadata() {
  const t = await getTranslations("admin.users");
  return { title: t("title") };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireAdmin();
  const { q } = await searchParams;
  const [t, rows] = await Promise.all([getTranslations("admin.users"), listAdminUsers(q)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

        {/* Plain GET form: search works without JavaScript. */}
        <form className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder={t("search")}
            aria-label={t("search")}
            className="pl-9"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
                <TableHead className="text-right">{t("role")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.phoneNumber ?? "—"}
                    {user.phoneNumberVerified ? (
                      <Badge variant="success" className="ml-2">
                        ✓
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "outline"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.status === "suspended" ? (
                      <Badge variant="destructive">{t("suspended")}</Badge>
                    ) : (
                      <Badge variant="success">{t("active")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.createdAt.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminUserActions
                      userId={user.id}
                      role={user.role}
                      status={user.status}
                      isSelf={user.id === admin.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
