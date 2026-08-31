import type { Metadata } from "next";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CheckSquare2,
} from "lucide-react";

import { ProjectChart } from "@/components/dashboard/project-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { activityScope } from "@/lib/activity-scope";
import {
  projectScope,
  requireUser,
  taskScope,
  clientScope,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate, humanize } from "@/lib/format";
import { isOverdue, startOfTodayUtc } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

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
      orderBy: { createdAt: "desc" },
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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-muted-foreground text-sm">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </div>
              <span className="grid size-10 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Project status</CardTitle>
            <CardDescription>
              Current distribution of visible projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectChart
              data={groups.map((item) => ({
                status: humanize(item.status),
                count: item._count._all,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
            <CardDescription>Nearest open task due dates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {deadlines.length ? (
              deadlines.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-3 border-b py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {task.project.name}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ${isOverdue(task.deadline, task.status) ? "text-danger" : "text-muted-foreground"}`}
                  >
                    {formatDate(task.deadline)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground py-12 text-center text-sm">
                No upcoming deadlines.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest changes within your access.</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length ? (
            <div className="divide-y">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm">{item.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge value={item.entityType} />
                      <span className="text-muted-foreground text-xs">
                        {item.user?.name ?? "System"}
                      </span>
                    </div>
                  </div>
                  <time className="text-muted-foreground text-xs whitespace-nowrap">
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
        </CardContent>
      </Card>
    </div>
  );
}
