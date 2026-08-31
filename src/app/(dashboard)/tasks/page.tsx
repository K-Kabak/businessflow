import type { Prisma } from "@/generated/prisma/client";
import type { Metadata } from "next";
import { CheckSquare2, Plus, X } from "lucide-react";
import Link from "next/link";

import { TaskStatusSelect } from "@/components/tasks/status-select";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { projectScope, requireUser, taskScope } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import {
  PAGE_SIZE,
  pageParam,
  param,
  type SearchParams,
} from "@/lib/search-params";
import { isOverdue } from "@/lib/utils";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const search = param(query.search);
  const status = param(query.status);
  const priority = param(query.priority);
  const projectId = param(query.project);
  const assigneeId = param(query.assignee);
  const page = pageParam(query.page);
  const sort = param(query.sort, "createdAt");
  const direction = param(query.direction, "desc") === "asc" ? "asc" : "desc";
  const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
  const where: Prisma.TaskWhereInput = {
    ...taskScope(user),
    ...(validStatuses.includes(status as (typeof validStatuses)[number])
      ? { status: status as (typeof validStatuses)[number] }
      : {}),
    ...(validPriorities.includes(priority as (typeof validPriorities)[number])
      ? { priority: priority as (typeof validPriorities)[number] }
      : {}),
    ...(projectId ? { projectId } : {}),
    ...(assigneeId === "unassigned"
      ? { assigneeId: null }
      : assigneeId
        ? { assigneeId }
        : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
  };
  const priorityOrder =
    sort === "priority"
      ? ([
          { priority: direction },
          { createdAt: "desc" },
        ] as Prisma.TaskOrderByWithRelationInput[])
      : undefined;
  const orderBy:
    | Prisma.TaskOrderByWithRelationInput
    | Prisma.TaskOrderByWithRelationInput[] =
    priorityOrder ??
    (sort === "deadline" ? { deadline: direction } : { createdAt: direction });
  const [tasks, total, projects, assignees] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.task.count({ where }),
    prisma.project.findMany({
      where: projectScope(user),
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Search and manage work across accessible projects."
        action={
          user.role === "ADMIN" ? (
            <Button asChild>
              <Link href="/tasks/new">
                <Plus className="size-4" />
                New task
              </Link>
            </Button>
          ) : undefined
        }
      />
      <FilterBar>
        <form className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_repeat(5,minmax(118px,140px))_auto]">
          <Input
            name="search"
            defaultValue={search}
            placeholder="Search tasks…"
            aria-label="Search tasks"
          />
          <Select
            name="status"
            defaultValue={status}
            aria-label="Filter task status"
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
            aria-label="Filter task priority"
          >
            <option value="">All priorities</option>
            {validPriorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            name="project"
            defaultValue={projectId}
            aria-label="Filter project"
          >
            <option value="">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select
            name="assignee"
            defaultValue={assigneeId}
            aria-label="Filter assignee"
          >
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {assignees.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Select>
          <Select name="sort" defaultValue={sort} aria-label="Sort tasks">
            <option value="createdAt">Sort: Created</option>
            <option value="deadline">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
          </Select>
          <Button variant="secondary">Apply</Button>
        </form>
        {search || status || priority || projectId || assigneeId ? (
          <div className="mt-2 flex items-center border-t px-1 pt-2 text-xs">
            <span className="text-muted-foreground">Filters active</span>
            <Link
              href="/tasks"
              className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1"
            >
              <X className="size-3" /> Clear
            </Link>
          </div>
        ) : null}
      </FilterBar>
      {tasks.length ? (
        <>
          <div className="hidden md:block">
            <TableShell>
              <table className="w-full">
                <caption className="sr-only">
                  Tasks in accessible projects
                </caption>
                <thead className="bg-muted/60">
                  <tr>
                    <th className={thClass}>Task</th>
                    <th className={thClass}>Project</th>
                    <th className={thClass}>Assignee</th>
                    <th className={thClass}>Status</th>
                    <th className={thClass}>Priority</th>
                    <th className={thClass}>Deadline</th>
                    <th className={thClass}></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-muted/30">
                      <td className={tdClass}>
                        <p className="font-medium">{task.title}</p>
                      </td>
                      <td className={tdClass}>
                        <Link
                          href={`/projects/${task.projectId}`}
                          className="hover:text-primary"
                        >
                          {task.project.name}
                        </Link>
                      </td>
                      <td className={tdClass}>
                        {task.assignee ? (
                          <span className="flex items-center gap-2">
                            <Avatar name={task.assignee.name} size="sm" />
                            {task.assignee.name}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={tdClass}>
                        {user.role === "EMPLOYEE" ? (
                          <TaskStatusSelect
                            taskId={task.id}
                            value={task.status}
                          />
                        ) : (
                          <Badge value={task.status} />
                        )}
                      </td>
                      <td className={tdClass}>
                        <Badge value={task.priority} />
                      </td>
                      <td
                        className={`${tdClass} ${isOverdue(task.deadline, task.status) ? "text-danger font-medium" : ""}`}
                      >
                        {formatDate(task.deadline)}
                      </td>
                      <td className={tdClass}>
                        {user.role === "ADMIN" ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/tasks/${task.id}/edit`}>Edit</Link>
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>
          </div>
          <div className="bg-card overflow-hidden rounded-lg border md:hidden">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex gap-3 border-b p-4 last:border-0"
              >
                <span className="bg-muted text-muted-foreground grid size-9 shrink-0 place-items-center rounded-md">
                  <CheckSquare2 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{task.title}</p>
                    {user.role === "EMPLOYEE" ? (
                      <TaskStatusSelect taskId={task.id} value={task.status} />
                    ) : (
                      <Badge value={task.status} />
                    )}
                  </div>
                  <Link
                    href={`/projects/${task.projectId}`}
                    className="text-muted-foreground mt-1 block truncate text-xs"
                  >
                    {task.project.name}
                  </Link>
                  <div className="text-muted-foreground mt-3 flex items-center justify-between gap-2 text-xs">
                    <span>
                      {task.assignee ? (
                        <span className="flex items-center gap-1.5">
                          <Avatar name={task.assignee.name} size="sm" />
                          {task.assignee.name}
                        </span>
                      ) : (
                        "Unassigned"
                      )}
                    </span>
                    <span
                      className={
                        isOverdue(task.deadline, task.status)
                          ? "text-danger font-medium"
                          : ""
                      }
                    >
                      {formatDate(task.deadline)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge value={task.priority} />
                    {user.role === "ADMIN" ? (
                      <Link
                        href={`/tasks/${task.id}/edit`}
                        className="text-primary text-xs font-medium"
                      >
                        Edit task
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            path="/tasks"
            params={{
              search,
              status,
              priority,
              project: projectId,
              assignee: assigneeId,
              sort,
              direction,
            }}
          />
        </>
      ) : (
        <EmptyState
          title="No tasks found"
          description="Create a task or adjust the current filters."
          href={user.role === "ADMIN" && !search ? "/tasks/new" : undefined}
          action="Create task"
        />
      )}
    </div>
  );
}
