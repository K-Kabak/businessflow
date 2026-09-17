import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PrismaClient, type UserRole } from "@/generated/prisma/client";
import { clientScope } from "@/lib/auth-helpers";

const authState = vi.hoisted(() => ({
  user: null as null | {
    id: string;
    organizationId: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    jobTitle: string | null;
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/auth", () => ({ auth: async () => ({ user: authState.user }) }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: () => {
    throw new Error("NEXT_REDIRECT");
  },
}));

const databaseUrl = process.env.TEST_DATABASE_URL;
const db = databaseUrl
  ? new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    })
  : null;
const suite =
  databaseUrl && databaseUrl === process.env.DATABASE_URL
    ? describe
    : describe.skip;

const projectInput = {
  name: "Website Redesign",
  description: "",
  status: "PLANNING" as const,
  priority: "MEDIUM" as const,
  budget: "",
  startDate: "",
  deadline: "",
};

suite("stage one security and activity", () => {
  beforeEach(async () => {
    await db!.organization.deleteMany({
      where: { slug: { in: ["stage-one-a", "stage-one-b"] } },
    });
  });

  afterAll(async () => {
    await db?.organization.deleteMany({
      where: { slug: { in: ["stage-one-a", "stage-one-b"] } },
    });
    await db?.$disconnect();
  });

  async function fixtures() {
    const [organization, foreignOrganization] = await Promise.all([
      db!.organization.create({
        data: { name: "Stage One A", slug: "stage-one-a" },
      }),
      db!.organization.create({
        data: { name: "Stage One B", slug: "stage-one-b" },
      }),
    ]);
    const [admin, employee, secondEmployee, foreignEmployee] =
      await Promise.all([
        db!.user.create({
          data: {
            organizationId: organization.id,
            name: "Anna Kowalska",
            email: "stage-one-admin-a@test.local",
            passwordHash: "test",
            role: "ADMIN",
          },
        }),
        db!.user.create({
          data: {
            organizationId: organization.id,
            name: "Marek Nowak",
            email: "stage-one-employee-a@test.local",
            passwordHash: "test",
          },
        }),
        db!.user.create({
          data: {
            organizationId: organization.id,
            name: "Jan Nowak",
            email: "stage-one-employee-a2@test.local",
            passwordHash: "test",
          },
        }),
        db!.user.create({
          data: {
            organizationId: foreignOrganization.id,
            name: "Foreign User",
            email: "stage-one-employee-b@test.local",
            passwordHash: "test",
          },
        }),
      ]);
    const [visibleClient, hiddenClient] = await Promise.all([
      db!.client.create({
        data: { organizationId: organization.id, name: "Visible Client" },
      }),
      db!.client.create({
        data: { organizationId: organization.id, name: "Hidden Client" },
      }),
    ]);
    const project = await db!.project.create({
      data: {
        organizationId: organization.id,
        clientId: visibleClient.id,
        name: projectInput.name,
      },
    });
    await db!.projectMember.create({
      data: {
        organizationId: organization.id,
        projectId: project.id,
        userId: employee.id,
      },
    });
    await db!.project.create({
      data: {
        organizationId: organization.id,
        clientId: hiddenClient.id,
        name: "Hidden Project",
      },
    });
    authState.user = {
      id: admin.id,
      organizationId: organization.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatarUrl: null,
      jobTitle: null,
    };
    return {
      organization,
      admin,
      employee,
      secondEmployee,
      foreignEmployee,
      visibleClient,
      hiddenClient,
      project,
    };
  }

  it("limits the employee client list to clients from assigned projects", async () => {
    const data = await fixtures();
    const employee = {
      ...authState.user!,
      id: data.employee.id,
      name: data.employee.name,
      email: data.employee.email,
      role: "EMPLOYEE" as const,
    };

    const clients = await db!.client.findMany({
      where: clientScope(employee),
      select: { id: true, name: true },
    });

    expect(clients).toEqual([
      { id: data.visibleClient.id, name: data.visibleClient.name },
    ]);
    expect(clients).not.toContainEqual({
      id: data.hiddenClient.id,
      name: data.hiddenClient.name,
    });
  });

  it("logs real project member additions and removals and rejects a foreign member", async () => {
    const data = await fixtures();
    const { saveProjectAction } = await import("@/features/actions");

    const added = await saveProjectAction({
      ...projectInput,
      id: data.project.id,
      clientId: data.visibleClient.id,
      memberIds: [data.employee.id, data.secondEmployee.id],
    });
    expect(added.success, JSON.stringify(added)).toBe(true);
    expect(
      await db!.activityLog.findFirst({
        where: {
          entityId: data.project.id,
          action: "ASSIGNED",
          metadata: { path: ["membershipChange"], equals: "ADDED" },
        },
      }),
    ).toMatchObject({
      description:
        "Anna Kowalska added Jan Nowak to project “Website Redesign”.",
    });

    const task = await db!.task.create({
      data: {
        organizationId: data.organization.id,
        projectId: data.project.id,
        assigneeId: data.employee.id,
        title: "Member task",
      },
    });
    const removed = await saveProjectAction({
      ...projectInput,
      id: data.project.id,
      clientId: data.visibleClient.id,
      memberIds: [data.secondEmployee.id],
    });
    expect(removed.success).toBe(true);
    expect(
      await db!.activityLog.findFirst({
        where: {
          entityId: data.project.id,
          action: "ASSIGNED",
          metadata: { path: ["membershipChange"], equals: "REMOVED" },
        },
      }),
    ).toMatchObject({
      description:
        "Anna Kowalska removed Marek Nowak from project “Website Redesign”.",
    });
    expect(await db!.task.findUnique({ where: { id: task.id } })).toMatchObject(
      {
        assigneeId: null,
      },
    );

    const foreign = await saveProjectAction({
      ...projectInput,
      id: data.project.id,
      clientId: data.visibleClient.id,
      memberIds: [data.foreignEmployee.id],
    });
    expect(foreign).toMatchObject({ success: false, code: "VALIDATION" });
  });

  it("logs assignment, reassignment, and unassignment without duplicate no-op logs", async () => {
    const data = await fixtures();
    await db!.projectMember.create({
      data: {
        organizationId: data.organization.id,
        projectId: data.project.id,
        userId: data.secondEmployee.id,
      },
    });
    const { saveTaskAction } = await import("@/features/actions");
    const baseInput = {
      projectId: data.project.id,
      title: "Prepare dashboard layout",
      description: "",
      status: "TODO" as const,
      priority: "MEDIUM" as const,
      deadline: "",
    };

    const created = await saveTaskAction({
      ...baseInput,
      assigneeId: data.employee.id,
    });
    expect(created.success).toBe(true);
    const taskId = created.success ? created.data!.id : "";
    expect(
      await db!.activityLog.findFirst({
        where: { entityId: taskId, action: "ASSIGNED" },
      }),
    ).toMatchObject({
      description:
        "Anna Kowalska assigned task “Prepare dashboard layout” to Marek Nowak.",
    });

    await saveTaskAction({
      ...baseInput,
      id: taskId,
      assigneeId: data.secondEmployee.id,
    });
    await saveTaskAction({
      ...baseInput,
      id: taskId,
      assigneeId: data.secondEmployee.id,
    });
    expect(
      await db!.activityLog.findMany({
        where: { entityId: taskId, action: "ASSIGNED" },
        orderBy: { createdAt: "asc" },
        select: { description: true },
      }),
    ).toEqual([
      {
        description:
          "Anna Kowalska assigned task “Prepare dashboard layout” to Marek Nowak.",
      },
      {
        description:
          "Anna Kowalska reassigned task “Prepare dashboard layout” from Marek Nowak to Jan Nowak.",
      },
    ]);

    await saveTaskAction({ ...baseInput, id: taskId, assigneeId: "" });
    expect(
      await db!.activityLog.findMany({
        where: { entityId: taskId, action: "ASSIGNED" },
        orderBy: { createdAt: "asc" },
        select: { description: true },
      }),
    ).toHaveLength(3);
    expect(
      await db!.activityLog.findFirst({
        where: { entityId: taskId, action: "ASSIGNED" },
        orderBy: { createdAt: "desc" },
      }),
    ).toMatchObject({
      description:
        "Anna Kowalska unassigned Jan Nowak from task “Prepare dashboard layout”.",
    });

    const foreign = await saveTaskAction({
      ...baseInput,
      id: taskId,
      assigneeId: data.foreignEmployee.id,
    });
    expect(foreign).toMatchObject({ success: false, code: "VALIDATION" });
  });
});
