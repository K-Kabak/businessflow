import type { Prisma } from "@/generated/prisma/client";
import { Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  PageHeader,
  TableShell,
  tdClass,
  thClass,
} from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { Input, Select } from "@/components/ui/form-controls";
import { clientScope, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  PAGE_SIZE,
  pageParam,
  param,
  type SearchParams,
} from "@/lib/search-params";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const search = param(query.search);
  const status = param(query.status);
  const page = pageParam(query.page);
  const sort = param(query.sort, "name");
  const direction = param(query.direction, "asc") === "desc" ? "desc" : "asc";
  const where: Prisma.ClientWhereInput = {
    ...clientScope(user),
    ...(status === "ACTIVE" || status === "INACTIVE" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { company: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.ClientOrderByWithRelationInput =
    sort === "createdAt" ? { createdAt: direction } : { name: direction };
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { projects: true } } },
    }),
    prisma.client.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={
          user.role === "ADMIN"
            ? "Manage organizations and contacts you work with."
            : "Clients connected to your assigned projects."
        }
        action={
          user.role === "ADMIN" ? (
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="size-4" />
                Add client
              </Link>
            </Button>
          ) : undefined
        }
      />
      <form className="grid gap-3 sm:grid-cols-[1fr_180px_140px_auto]">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search clients…"
          aria-label="Search clients"
        />
        <Select name="status" defaultValue={status} aria-label="Filter status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <Select name="sort" defaultValue={sort} aria-label="Sort clients">
          <option value="name">Name</option>
          <option value="createdAt">Created</option>
        </Select>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>
      {clients.length ? (
        <>
          <TableShell>
            <table className="w-full">
              <thead className="bg-muted/60">
                <tr>
                  <th className={thClass}>Client</th>
                  <th className={thClass}>Company</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>Projects</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Created</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-muted/30">
                    <td className={tdClass}>
                      <Link
                        className="hover:text-primary font-medium"
                        href={`/clients/${client.id}`}
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className={tdClass}>{client.company ?? "—"}</td>
                    <td className={tdClass}>{client.email ?? "—"}</td>
                    <td className={tdClass}>{client._count.projects}</td>
                    <td className={tdClass}>
                      <Badge value={client.status} />
                    </td>
                    <td className={tdClass}>{formatDate(client.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
          <Pagination
            page={page}
            totalPages={totalPages}
            path="/clients"
            params={{ search, status, sort, direction }}
          />
        </>
      ) : (
        <EmptyState
          title={
            search || status
              ? "No clients match these filters"
              : "No clients yet"
          }
          description={
            search || status
              ? "Try adjusting your search or status filter."
              : "Add your first client to start managing projects."
          }
          href={
            user.role === "ADMIN" && !search && !status
              ? "/clients/new"
              : undefined
          }
          action="Add client"
        />
      )}
    </div>
  );
}
