import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/forms/resource-forms";
import { PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { toDateInputValue } from "@/lib/utils";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await requireAdmin();
  const { projectId } = await params;
  const [project, clients, members] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
      include: { members: { select: { userId: true } } },
    }),
    prisma.client.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  if (!project) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`Edit ${project.name}`}
        description="Update project scope, timing, and team."
      />
      <section className="rounded-lg border bg-card p-5 sm:p-6">
          <ProjectForm
            clients={clients}
            members={members}
            initial={{
              id: project.id,
              clientId: project.clientId,
              name: project.name,
              description: project.description ?? "",
              status: project.status,
              priority: project.priority,
              budget: project.budget?.toString() ?? "",
              startDate: toDateInputValue(project.startDate),
              deadline: toDateInputValue(project.deadline),
              memberIds: project.members.map((member) => member.userId),
            }}
          />
      </section>
    </div>
  );
}
