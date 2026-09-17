import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  user: { id: "", organizationId: "" },
}));

vi.mock("@/auth", () => ({ auth: async () => ({ user: session.user }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: () => {
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  return {
    prisma: new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.TEST_DATABASE_URL,
      }),
    }),
  };
});

import {
  deleteClientAction,
  deleteProjectAction,
  deleteTaskAction,
  saveClientAction,
  saveProjectAction,
  saveTaskAction,
  updateTaskStatusAction,
} from "@/features/actions";
import { prisma as db } from "@/lib/db";
import { activityScope } from "@/lib/activity-scope";
import {
  clientScope,
  projectScope,
  requireUser,
  taskScope,
} from "@/lib/auth-helpers";

const suite = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const slugs = ["app-tenant-a", "app-tenant-b"];

suite("application tenant isolation", () => {
  beforeEach(async () => {
    await db.organization.deleteMany({ where: { slug: { in: slugs } } });
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { slug: { in: slugs } } });
    await db.$disconnect();
  });

  async function fixtures() {
    const [a, b] = await Promise.all([
      db.organization.create({ data: { name: "App A", slug: slugs[0] } }),
      db.organization.create({ data: { name: "App B", slug: slugs[1] } }),
    ]);
    const [adminA, employeeA, adminB] = await Promise.all([
      db.user.create({
        data: {
          organizationId: a.id,
          name: "Admin A",
          email: "app-admin-a@test.local",
          passwordHash: "test",
          role: "ADMIN",
        },
      }),
      db.user.create({
        data: {
          organizationId: a.id,
          name: "Employee A",
          email: "app-employee-a@test.local",
          passwordHash: "test",
        },
      }),
      db.user.create({
        data: {
          organizationId: b.id,
          name: "Admin B",
          email: "app-admin-b@test.local",
          passwordHash: "test",
          role: "ADMIN",
        },
      }),
    ]);
    const [clientA, hiddenClientA, clientB] = await Promise.all([
      db.client.create({ data: { organizationId: a.id, name: "Client A" } }),
      db.client.create({
        data: { organizationId: a.id, name: "Hidden Client A" },
      }),
      db.client.create({ data: { organizationId: b.id, name: "Client B" } }),
    ]);
    const [projectA, hiddenProjectA, projectB] = await Promise.all([
      db.project.create({
        data: { organizationId: a.id, clientId: clientA.id, name: "Project A" },
      }),
      db.project.create({
        data: {
          organizationId: a.id,
          clientId: hiddenClientA.id,
          name: "Hidden Project A",
        },
      }),
      db.project.create({
        data: { organizationId: b.id, clientId: clientB.id, name: "Project B" },
      }),
    ]);
    await db.projectMember.create({
      data: {
        organizationId: a.id,
        projectId: projectA.id,
        userId: employeeA.id,
      },
    });
    const [taskA, hiddenTaskA, taskB] = await Promise.all([
      db.task.create({
        data: { organizationId: a.id, projectId: projectA.id, title: "Task A" },
      }),
      db.task.create({
        data: {
          organizationId: a.id,
          projectId: hiddenProjectA.id,
          title: "Hidden Task A",
        },
      }),
      db.task.create({
        data: { organizationId: b.id, projectId: projectB.id, title: "Task B" },
      }),
    ]);
    await db.activityLog.createMany({
      data: [
        {
          organizationId: a.id,
          entityType: "PROJECT",
          entityId: projectA.id,
          action: "UPDATED",
          description: "Visible activity",
        },
        {
          organizationId: a.id,
          entityType: "PROJECT",
          entityId: hiddenProjectA.id,
          action: "UPDATED",
          description: "Hidden activity",
        },
      ],
    });
    return {
      a,
      b,
      adminA,
      employeeA,
      adminB,
      clientA,
      hiddenClientA,
      clientB,
      projectA,
      hiddenProjectA,
      projectB,
      taskA,
      hiddenTaskA,
      taskB,
    };
  }

  it("hides foreign resources and rejects cross-tenant mutations", async () => {
    const f = await fixtures();
    session.user = { id: f.adminB.id, organizationId: f.b.id };
    const user = await requireUser();

    expect(
      await db.client.findFirst({
        where: { id: f.clientA.id, ...clientScope(user) },
      }),
    ).toBeNull();
    expect(
      await db.project.findFirst({
        where: { id: f.projectA.id, ...projectScope(user) },
      }),
    ).toBeNull();
    expect(
      await db.task.findFirst({
        where: { id: f.taskA.id, ...taskScope(user) },
      }),
    ).toBeNull();

    expect(
      await saveClientAction({
        id: f.clientA.id,
        name: "Compromised client",
        status: "ACTIVE",
      }),
    ).toMatchObject({ success: false, code: "NOT_FOUND" });
    expect(await deleteClientAction(f.clientA.id)).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
    expect(
      await saveProjectAction({
        id: f.projectA.id,
        clientId: f.clientB.id,
        name: "Compromised project",
        status: "PLANNING",
        priority: "MEDIUM",
        memberIds: [],
      }),
    ).toMatchObject({ success: false, code: "NOT_FOUND" });
    expect(await deleteProjectAction(f.projectA.id)).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
    expect(
      await saveTaskAction({
        id: f.taskA.id,
        projectId: f.projectB.id,
        title: "Compromised task",
        status: "TODO",
        priority: "MEDIUM",
      }),
    ).toMatchObject({ success: false, code: "NOT_FOUND" });
    expect(await deleteTaskAction(f.taskA.id)).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
    expect(await updateTaskStatusAction(f.taskA.id, "DONE")).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });

    expect(
      await db.client.findUnique({ where: { id: f.clientA.id } }),
    ).toMatchObject({
      name: "Client A",
    });
    expect(
      await db.project.findUnique({ where: { id: f.projectA.id } }),
    ).toMatchObject({
      name: "Project A",
    });
    expect(
      await db.task.findUnique({ where: { id: f.taskA.id } }),
    ).toMatchObject({
      title: "Task A",
      status: "TODO",
    });
  });

  it("applies employee scopes to projects, clients, tasks, activity and status changes", async () => {
    const f = await fixtures();
    session.user = { id: f.employeeA.id, organizationId: f.a.id };
    const user = await requireUser();

    expect(
      (await db.project.findMany({ where: projectScope(user) })).map(
        (item) => item.id,
      ),
    ).toEqual([f.projectA.id]);
    expect(
      (await db.client.findMany({ where: clientScope(user) })).map(
        (item) => item.id,
      ),
    ).toEqual([f.clientA.id]);
    expect(
      (await db.task.findMany({ where: taskScope(user) })).map(
        (item) => item.id,
      ),
    ).toEqual([f.taskA.id]);
    expect(
      (await db.activityLog.findMany({ where: await activityScope(user) })).map(
        (item) => item.description,
      ),
    ).toEqual(["Visible activity"]);

    expect(await updateTaskStatusAction(f.taskA.id, "DONE")).toMatchObject({
      success: true,
    });
    expect(
      await updateTaskStatusAction(f.hiddenTaskA.id, "DONE"),
    ).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
    expect(await updateTaskStatusAction(f.taskB.id, "DONE")).toMatchObject({
      success: false,
      code: "NOT_FOUND",
    });
  });
});
