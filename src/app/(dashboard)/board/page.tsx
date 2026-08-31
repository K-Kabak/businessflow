import type { Prisma } from "@/generated/prisma/client";
import { KanbanBoard } from "@/components/board/kanban-board";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { projectScope, requireUser, taskScope } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { param, type SearchParams } from "@/lib/search-params";

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const projectId = param(query.project);
  const assigneeId = param(query.assignee);
  const mine = param(query.mine) === "1";
  const where: Prisma.TaskWhereInput = {
    ...taskScope(user),
    ...(projectId ? { projectId } : {}),
    ...(mine ? { assigneeId: user.id } : assigneeId ? { assigneeId } : {}),
  };
  const [tasks, projects, assignees] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { position: "asc" }],
      include: {
        project: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
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
  const boardTasks = tasks.map((task) => ({
    ...task,
    deadline: task.deadline?.toISOString() ?? null,
  }));
  const boardKey = boardTasks
    .map((task) => `${task.id}:${task.status}:${task.position}`)
    .join("|");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Board"
        description="Drag tasks across stages. Changes persist immediately."
      />
      <form className="grid gap-3 sm:grid-cols-[220px_220px_auto_auto]">
        <Select name="project" defaultValue={projectId}>
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </Select>
        <Select name="assignee" defaultValue={assigneeId} disabled={mine}>
          <option value="">All assignees</option>
          {assignees.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
        <label className="bg-card flex h-10 items-center gap-2 rounded-lg border px-3 text-sm">
          <input type="checkbox" name="mine" value="1" defaultChecked={mine} />
          My tasks
        </label>
        <Button variant="outline">Apply filters</Button>
      </form>
      {tasks.length ? (
        <KanbanBoard key={boardKey} initialTasks={boardTasks} />
      ) : (
        <EmptyState
          title="No tasks on this board"
          description="Adjust the filters or ask an administrator to add tasks."
        />
      )}
    </div>
  );
}
