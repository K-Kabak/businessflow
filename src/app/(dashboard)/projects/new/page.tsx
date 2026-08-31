import { ProjectForm } from "@/components/forms/resource-forms";
import { PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export default async function NewProjectPage() {
  const user = await requireAdmin();
  const [clients, members] = await Promise.all([
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
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Create project"
        description="Set the client, scope, timeline, and delivery team."
      />
      <section className="rounded-lg border bg-card p-5 sm:p-6">
          <ProjectForm clients={clients} members={members} />
      </section>
    </div>
  );
}
