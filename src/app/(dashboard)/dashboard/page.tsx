import type { Metadata } from "next";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CheckSquare2,
  Clock3,
} from "lucide-react";

import { ProjectChart } from "@/components/dashboard/project-chart";
import { PageHeader } from "@/components/ui/page";
import { activityScope } from "@/lib/activity-scope";
import {
  projectScope,
  requireUser,
  taskScope,
  clientScope,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate, humanize, relativeDeadline } from "@/lib/format";
import { isOverdue, startOfTodayUtc } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };
const projectStatusOrder = [
  "PLANNING",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const projectsWhere = projectScope(user);
  const tasksWhere = taskScope(user);
  const clientsWhere = clientScope(user);
  const logWhere = await activityScope(user);
  const [
    activeProjects,
    openTasks,
    overdueTasks,
    activeClients,
    groups,
    deadlines,
    activity,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        ...projectsWhere,
        status: { in: ["PLANNING", "IN_PROGRESS", "ON_HOLD"] },
      },
    }),
    prisma.task.count({ where: { ...tasksWhere, status: { not: "DONE" } } }),
    prisma.task.count({
      where: {
        ...tasksWhere,
        status: { not: "DONE" },
        deadline: { lt: startOfTodayUtc() },
      },
    }),
    prisma.client.count({ where: { ...clientsWhere, status: "ACTIVE" } }),
    prisma.project.groupBy({
      by: ["status"],
      where: projectsWhere,
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: {
        ...tasksWhere,
        status: { not: "DONE" },
        deadline: { not: null },
      },
      orderBy: { deadline: "asc" },
      take: 5,
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.activityLog.findMany({
      where: logWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 8,
      include: { user: { select: { name: true } } },
    }),
  ]);
  const metrics = [
    {
      label: "Active projects",
      value: activeProjects,
      icon: BriefcaseBusiness,
    },
    { label: "Open tasks", value: openTasks, icon: CheckSquare2 },
    { label: "Overdue tasks", value: overdueTasks, icon: AlertTriangle },
    { label: "Active clients", value: activeClients, icon: Building2 },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description={
          user.role === "ADMIN"
            ? "Here is the latest across your organization."
            : "Here is the latest across your assigned work."
        }
      />
      <section className="bg-card grid overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => {
          const danger = label === "Overdue tasks" && value > 0;
          return (
            <div
              key={label}
              className="flex min-h-28 items-center justify-between border-b p-5 last:border-b-0 sm:nth-[odd]:border-r sm:nth-last-[-n+2]:border-b-0 xl:border-r xl:border-b-0 xl:last:border-r-0"
            >
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {label}
                </p>
                <p
                  data-visual-dynamic={
                    label === "Overdue tasks" ? "" : undefined
                  }
                  className={`mt-2 text-[28px] leading-8 font-semibold tracking-[-0.03em] ${danger ? "text-danger" : ""}`}
                >
                  {value}
                </p>
              </div>
              <span
                className={`grid size-9 place-items-center rounded-md ${danger ? "text-danger bg-red-500/9" : "bg-muted text-muted-foreground"}`}
              >
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
            </div>
          );
        })}
      </section>
      <section className="bg-card grid overflow-hidden rounded-lg border xl:grid-cols-[1.45fr_.85fr]">
        <div className="border-b p-5 xl:border-r xl:border-b-0">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Project distribution</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Visible projects grouped by delivery stage.
            </p>
          </div>
          <ProjectChart
            data={[...groups]
              .sort(
                (a, b) =>
                  projectStatusOrder.indexOf(a.status) -
                  projectStatusOrder.indexOf(b.status),
              )
              .map((item) => ({
                status: humanize(item.status),
                count: item._count._all,
              }))}
          />
        </div>
        <div className="p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Upcoming deadlines</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Nearest open task due dates.
            </p>
          </div>
          <div>
            {deadlines.length ? (
              deadlines.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 border-b py-3.5 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {task.title}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {task.project.name}
                    </p>
                  </div>
                  <span
                    data-visual-dynamic
                    className={`shrink-0 text-right text-[11px] font-medium ${isOverdue(task.deadline, task.status) ? "text-danger" : "text-muted-foreground"}`}
                  >
                    <span className="block">
                      {relativeDeadline(task.deadline)}
                    </span>
                    <span className="mt-0.5 block font-normal">
                      {formatDate(task.deadline)}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground py-12 text-center text-sm">
                No upcoming deadlines.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="bg-card rounded-lg border">
        <div className="border-b px-5 py-4">
          <h2 className="text-base font-semibold">Recent activity</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Latest changes within your access.
          </p>
        </div>
        <div className="px-5">
          {activity.length ? (
            <div>
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="before:border-primary before:bg-card relative flex items-start justify-between gap-4 border-b py-4 pl-7 before:absolute before:top-[22px] before:left-1.5 before:size-2 before:rounded-full before:border-2 last:border-0"
                >
                  <div>
                    <p className="text-[13px]">{item.description}</p>
                    <p className="text-muted-foreground mt-1 text-[11px]">
                      {humanize(item.entityType)} ·{" "}
                      {item.user?.name ?? "System"}
                    </p>
                  </div>
                  <time
                    data-visual-dynamic
                    className="text-muted-foreground flex items-center gap-1 text-[11px] whitespace-nowrap"
                  >
                    <Clock3 className="size-3" />
                    {formatDate(item.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-12 text-center text-sm">
              No activity yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
