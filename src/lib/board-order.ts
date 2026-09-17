import { Prisma, type TaskStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { taskScope, type requireUser } from "@/lib/auth-helpers";

export class BoardOrderError extends Error {}

export async function serializable<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let retry = 0; ; retry++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2034" ||
        retry >= 3
      )
        throw error;
    }
  }
}

// The complete destination column is read: browser filters never define rank scope.
export async function placeTask(
  tx: Prisma.TransactionClient,
  user: Awaited<ReturnType<typeof requireUser>>,
  task: { id: string; projectId: string },
  status: TaskStatus,
  beforeTaskId?: string | null,
  afterTaskId?: string | null,
) {
  const current = await tx.task.findFirst({
    where: { id: task.id, projectId: task.projectId, ...taskScope(user) },
    select: { position: true, status: true },
  });
  if (!current) throw new BoardOrderError("Task not found.");
  const where = { ...taskScope(user), projectId: task.projectId, status };
  const column = await tx.task.findMany({
    where: { ...where, id: { not: task.id } },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true, position: true },
  });
  const before = column.findIndex((item) => item.id === beforeTaskId);
  const after = column.findIndex((item) => item.id === afterTaskId);
  if (
    (beforeTaskId && before < 0) ||
    (afterTaskId && after < 0) ||
    (beforeTaskId && afterTaskId && before >= after)
  ) {
    throw new BoardOrderError(
      "Board position is no longer available. Refresh and try again.",
    );
  }
  const index = afterTaskId ? after : beforeTaskId ? before + 1 : column.length;
  const ordered = [...column];
  ordered.splice(index, 0, { id: task.id, position: current.position });
  for (const [i, item] of ordered.entries()) {
    const position = (i + 1) * 1000;
    if (
      item.position !== position ||
      (item.id === task.id && current.status !== status)
    ) {
      await tx.task.update({
        where: { id: item.id, ...taskScope(user), projectId: task.projectId },
        data: item.id === task.id ? { position, status } : { position },
      });
    }
  }
}
