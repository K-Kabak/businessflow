import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/delete-button";
import { TaskForm } from "@/components/forms/resource-forms";
import { PageHeader } from "@/components/ui/page";
import { deleteTaskAction } from "@/features/actions";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { toDateInputValue } from "@/lib/utils";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const user = await requireAdmin();
  const { taskId } = await params;
  const [task, projects] = await Promise.all([
    prisma.task.findFirst({
      where: { id: taskId, organizationId: user.organizationId },
    }),
    prisma.project.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        members: {
          select: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    }),
  ]);
  if (!task) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`Edit ${task.title}`}
        description="Update task details, ownership, and status."
      />
      <section className="rounded-lg border bg-card p-5 sm:p-6">
          <TaskForm
            initial={{
              id: task.id,
              title: task.title,
              projectId: task.projectId,
              assigneeId: task.assigneeId ?? "",
              description: task.description ?? "",
              status: task.status,
              priority: task.priority,
              deadline: toDateInputValue(task.deadline),
            }}
            projects={projects.map((project) => ({
              id: project.id,
              name: project.name,
              members: project.members.map((member) => member.user),
            }))}
          />
      </section>
      <section className="flex flex-col gap-4 rounded-lg border border-red-500/25 bg-red-500/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-sm font-semibold">Delete task</h2><p className="text-muted-foreground mt-1 text-xs">Permanently remove this task while preserving its title in the activity log.</p></div>
        <DeleteButton label={`Delete ${task.title}?`} description="This permanently removes the task while preserving its title in the activity log." action={deleteTaskAction.bind(null, task.id)} redirectTo="/tasks" />
      </section>
    </div>
  );
}
