import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableShell, tdClass, thClass } from "@/components/ui/page";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export default async function TeamPage() {
  const user = await requireUser();
  const members = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      jobTitle: true,
      _count: {
        select: {
          projectMembers: {
            where: {
              project: {
                status: { in: ["PLANNING", "IN_PROGRESS", "ON_HOLD"] },
              },
            },
          },
          assignedTasks: { where: { status: { not: "DONE" } } },
        },
      },
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Organization members and their current workload."
      />
      <TableShell>
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Role</th>
              <th className={thClass}>Job title</th>
              <th className={thClass}>Active projects</th>
              <th className={thClass}>Open tasks</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-muted/30">
                <td className={tdClass}>
                  <span className="flex items-center gap-3">
                    <Avatar name={member.name} />{" "}
                    <span className="font-medium">{member.name}</span>
                  </span>
                </td>
                <td className={tdClass}>{member.email}</td>
                <td className={tdClass}>
                  <Badge value={member.role} />
                </td>
                <td className={tdClass}>{member.jobTitle ?? "—"}</td>
                <td className={tdClass}>{member._count.projectMembers}</td>
                <td className={tdClass}>{member._count.assignedTasks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
