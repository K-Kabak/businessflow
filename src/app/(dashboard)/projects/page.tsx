import type { Prisma } from "@/generated/prisma/client";
import { Plus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import {
  EmptyState,
  PageHeader,
  TableShell,
  tdClass,
  thClass,
} from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { projectScope, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { calculateProjectProgress } from "@/lib/utils";
import {
  PAGE_SIZE,
  pageParam,
  param,
  type SearchParams,
} from "@/lib/search-params";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const search = param(query.search);
  const status = param(query.status);
  const priority = param(query.priority);
  const clientId = param(query.client);
  const page = pageParam(query.page);
  const sort = param(query.sort, "createdAt");
  const direction = param(query.direction, "desc") === "asc" ? "asc" : "desc";
  const validStatuses = [
    "PLANNING",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED",
  ] as const;
  const validPriorities = ["LOW", "MEDIUM", "HIGH"] as const;
  const where: Prisma.ProjectWhereInput = {
    ...projectScope(user),
    ...(validStatuses.includes(status as (typeof validStatuses)[number])
      ? { status: status as (typeof validStatuses)[number] }
      : {}),
    ...(validPriorities.includes(priority as (typeof validPriorities)[number])
      ? { priority: priority as (typeof validPriorities)[number] }
      : {}),
    ...(clientId ? { clientId } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
  };
  const orderBy: Prisma.ProjectOrderByWithRelationInput =
    sort === "deadline"
      ? { deadline: direction }
      : sort === "status"
        ? { status: direction }
        : { createdAt: direction };
  const [projects, total, clients] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        client: { select: { name: true } },
        members: { include: { user: { select: { name: true } } } },
        tasks: { select: { status: true } },
      },
    }),
    prisma.project.count({ where }),
    prisma.client.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Track delivery, deadlines, and team ownership."
        action={
          user.role === "ADMIN" ? (
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="size-4" />
                New project
              </Link>
            </Button>
          ) : undefined
        }
      />
      <form className="grid gap-3 md:grid-cols-[1fr_160px_150px_180px_130px_auto]">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search projects…"
        />
        <Select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          {validStatuses.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </Select>
        <Select name="priority" defaultValue={priority}>
          <option value="">All priorities</option>
          {validPriorities.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <Select name="client" defaultValue={clientId}>
          <option value="">All clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>
        <Select name="sort" defaultValue={sort}>
          <option value="createdAt">Created</option>
          <option value="deadline">Deadline</option>
          <option value="status">Status</option>
        </Select>
        <Button variant="outline">Apply</Button>
      </form>
      {projects.length ? (
        <>
          <TableShell>
            <table className="w-full">
              <thead className="bg-muted/60">
                <tr>
                  <th className={thClass}>Project</th>
                  <th className={thClass}>Client</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Priority</th>
                  <th className={thClass}>Deadline</th>
                  <th className={thClass}>Progress</th>
                  <th className={thClass}>Team</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const progress = calculateProjectProgress(project.tasks);
                  return (
                    <tr key={project.id} className="hover:bg-muted/30">
                      <td className={tdClass}>
                        <Link
                          href={`/projects/${project.id}`}
                          className="hover:text-primary font-medium"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className={tdClass}>{project.client.name}</td>
                      <td className={tdClass}>
                        <Badge value={project.status} />
                      </td>
                      <td className={tdClass}>
                        <Badge value={project.priority} />
                      </td>
                      <td className={tdClass}>
                        {formatDate(project.deadline)}
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-2">
                          <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs">{progress}%</span>
                        </div>
                      </td>
                      <td className={tdClass}>{project.members.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableShell>
          <Pagination
            page={page}
            totalPages={totalPages}
            path="/projects"
            params={{
              search,
              status,
              priority,
              client: clientId,
              sort,
              direction,
            }}
          />
        </>
      ) : (
        <EmptyState
          title="No projects found"
          description="Create a project or adjust the current filters."
          href={user.role === "ADMIN" && !search ? "/projects/new" : undefined}
          action="Create project"
        />
      )}
    </div>
  );
}
