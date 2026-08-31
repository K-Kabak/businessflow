import { ArrowLeft, CalendarDays, Edit3, WalletCards } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
          <div className="flex items-center gap-2">
            <Badge value={project.status} />
          {user.role === "ADMIN" ? (
            <>
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
            </>
          ) : null}
          </div>
        }
      />
      <section className="bg-card grid overflow-hidden rounded-lg border sm:grid-cols-3">
        <div className="border-b p-5 sm:border-r sm:border-b-0">
          <p className="text-muted-foreground text-xs">Progress</p><div className="mt-2 flex items-center gap-3"><p className="text-2xl font-semibold tracking-tight">{progress}%</p><div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"><div className="bg-primary h-full" style={{ width: `${progress}%` }} /></div></div>
        </div>
        <div className="border-b p-5 sm:border-r sm:border-b-0"><p className="text-muted-foreground flex items-center gap-2 text-xs"><CalendarDays className="size-3.5" /> Deadline</p><p className="mt-2 font-medium">{formatDate(project.deadline)}</p></div>
        <div className="p-5"><p className="text-muted-foreground flex items-center gap-2 text-xs"><WalletCards className="size-3.5" /> Budget</p><p className="mt-2 font-medium">{formatMoney(project.budget)}</p></div>
      </section>
      <section className="overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
            <span className="mr-1 text-sm font-semibold">Project team</span>
            {project.members.map(({ user: member }) => (
              <div
                key={member.id}
                className="bg-muted/60 flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs"
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
          <div className="px-5"><ProjectTabs
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
          /></div>
      </section>
    </div>
  );
}
