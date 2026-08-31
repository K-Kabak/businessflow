import { ArrowLeft, CalendarDays, Edit3, WalletCards } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { deleteProjectAction } from "@/features/actions";
import { projectScope, requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { calculateProjectProgress } from "@/lib/utils";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireUser();
  const { projectId } = await params;
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...projectScope(user) },
    include: {
      client: { select: { id: true, name: true } },
      members: {
        include: { user: { select: { id: true, name: true, jobTitle: true } } },
      },
      tasks: {
        orderBy: [{ status: "asc" }, { position: "asc" }],
        include: { assignee: { select: { name: true } } },
      },
    },
  });
  if (!project) notFound();
  const taskIds = project.tasks.map((task) => task.id);
  const activity = await prisma.activityLog.findMany({
    where: {
      organizationId: user.organizationId,
      OR: [
        { entityType: "PROJECT", entityId: project.id },
        { entityType: "TASK", entityId: { in: taskIds } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });
  const progress = calculateProjectProgress(project.tasks);
  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/projects">
          <ArrowLeft className="size-4" />
          Back to projects
        </Link>
      </Button>
      <PageHeader
        title={project.name}
        description={`For ${project.client.name}`}
        action={
          user.role === "ADMIN" ? (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href={`/projects/${project.id}/edit`}>
                  <Edit3 className="size-4" />
                  Edit
                </Link>
              </Button>
              <DeleteButton
                label={`Delete ${project.name}?`}
                description="This permanently removes the project, its tasks, and project memberships."
                action={deleteProjectAction.bind(null, project.id)}
                redirectTo="/projects"
              />
            </div>
          ) : undefined
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs">Status</p>
            <div className="mt-2">
              <Badge value={project.status} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs">Progress</p>
            <p className="mt-2 text-2xl font-semibold">{progress}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <CalendarDays className="size-3" />
              Deadline
            </p>
            <p className="mt-2 font-medium">{formatDate(project.deadline)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <WalletCards className="size-3" />
              Budget
            </p>
            <p className="mt-2 font-medium">{formatMoney(project.budget)}</p>
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardContent className="p-5">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Team</span>
            {project.members.map(({ user: member }) => (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-xs"
              >
                <Avatar name={member.name} size="sm" />
                {member.name}
              </div>
            ))}
            {!project.members.length ? (
              <span className="text-muted-foreground text-sm">
                No members assigned.
              </span>
            ) : null}
          </div>
          <ProjectTabs
            description={project.description}
            canManage={user.role === "ADMIN"}
            tasks={project.tasks.map((task) => ({
              ...task,
              deadline: task.deadline?.toISOString() ?? null,
            }))}
            activity={activity.map((item) => ({
              ...item,
              createdAt: item.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
