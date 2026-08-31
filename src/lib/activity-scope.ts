import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { requireUser } from "@/lib/auth-helpers";

type CurrentUser = Awaited<ReturnType<typeof requireUser>>;

export async function activityScope(
  user: CurrentUser,
): Promise<Prisma.ActivityLogWhereInput> {
  if (user.role === "ADMIN") return { organizationId: user.organizationId };
  const projects = await prisma.project.findMany({
    where: {
      organizationId: user.organizationId,
      members: { some: { userId: user.id } },
    },
    select: { id: true, clientId: true, tasks: { select: { id: true } } },
  });
  const projectIds = projects.map((project) => project.id);
  const clientIds = [...new Set(projects.map((project) => project.clientId))];
  const taskIds = projects.flatMap((project) =>
    project.tasks.map((task) => task.id),
  );
  return {
    organizationId: user.organizationId,
    OR: [
      { entityType: "PROJECT", entityId: { in: projectIds } },
      { entityType: "CLIENT", entityId: { in: clientIds } },
      { entityType: "TASK", entityId: { in: taskIds } },
      { entityType: "USER", entityId: user.id },
    ],
  };
}
