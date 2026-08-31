import type { Prisma } from "@/generated/prisma/client";
import type { Metadata } from "next";
import { BriefcaseBusiness, Plus, X } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import {
  EmptyState,
  FilterBar,
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

export const metadata: Metadata = { title: "Projects" };

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
      <FilterBar>
        <form className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_150px_140px_170px_140px_auto]">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search projects…"
            aria-label="Search projects"
          />
          <Select
            name="status"
            defaultValue={status}
            aria-label="Filter project status"
          >
            <option value="">All statuses</option>
            {validStatuses.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Select
            name="priority"
            defaultValue={priority}
            aria-label="Filter project priority"
          >
            <option value="">All priorities</option>
            {validPriorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            name="client"
            defaultValue={clientId}
            aria-label="Filter client"
          >
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
          <Select name="sort" defaultValue={sort} aria-label="Sort projects">
            <option value="createdAt">Sort: Created</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="status">Sort: Status</option>
          </Select>
          <Button variant="secondary">Apply</Button>
        </form>
        {search || status || priority || clientId ? (
          <div className="mt-2 flex items-center border-t px-1 pt-2 text-xs">
            <span className="text-muted-foreground">Filters active</span>
            <Link
              href="/projects"
              className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1"
            >
              <X className="size-3" /> Clear
            </Link>
          </div>
        ) : null}
      </FilterBar>
      {projects.length ? (
        <>
          <div className="hidden md:block">
            <TableShell>
              <table className="w-full">
                <caption className="sr-only">
                  Projects in this workspace
                </caption>
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
                        <td className={tdClass}>
                          {project.members.length ? (
                            <div className="flex -space-x-1.5">
                              {project.members.slice(0, 3).map(({ user }) => (
                                <Avatar
                                  key={user.name}
                                  name={user.name}
                                  size="sm"
                                />
                              ))}
                              {project.members.length > 3 ? (
                                <span className="bg-muted text-muted-foreground ring-card grid size-7 place-items-center rounded-full text-[10px] ring-2">
                                  +{project.members.length - 3}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableShell>
          </div>
          <div className="bg-card overflow-hidden rounded-lg border md:hidden">
            {projects.map((project) => {
              const progress = calculateProjectProgress(project.tasks);
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="active:bg-muted flex gap-3 border-b p-4 last:border-0"
                >
                  <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-md">
                    <BriefcaseBusiness className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-medium">{project.name}</span>
                      <Badge value={project.status} />
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      {project.client.name}
                    </span>
                    <span className="mt-3 flex items-center gap-2">
                      <span className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                        <span
                          className="bg-primary block h-full"
                          style={{ width: `${progress}%` }}
                        />
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        {progress}%
                      </span>
                    </span>
                    <span className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                      <Badge value={project.priority} />
                      <span>{formatDate(project.deadline)}</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
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
