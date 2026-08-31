import { TaskForm } from "@/components/forms/resource-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export default async function NewTaskPage() {
  const user = await requireAdmin();
  const projects = await prisma.project.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      members: {
        select: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Create task"
        description="Add work to a project and assign an owner."
      />
      <Card>
        <CardHeader>
          <CardTitle>Task details</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            projects={projects.map((project) => ({
              id: project.id,
              name: project.name,
              members: project.members.map((member) => member.user),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
