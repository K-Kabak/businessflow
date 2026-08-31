import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.TEST_DATABASE_URL;
const db = databaseUrl
  ? new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    })
  : null;
const suite = databaseUrl ? describe : describe.skip;

suite("tenant isolation", () => {
  beforeEach(async () => {
    await db!.organization.deleteMany({
      where: { slug: { in: ["integration-a", "integration-b"] } },
    });
  });

  afterAll(async () => {
    await db?.organization.deleteMany({
      where: { slug: { in: ["integration-a", "integration-b"] } },
    });
    await db?.$disconnect();
  });

  async function fixtures() {
    const [a, b] = await Promise.all([
      db!.organization.create({
        data: { name: "Organization A", slug: "integration-a" },
      }),
      db!.organization.create({
        data: { name: "Organization B", slug: "integration-b" },
      }),
    ]);
    const [userA, userB, clientA, clientB] = await Promise.all([
      db!.user.create({
        data: {
          organizationId: a.id,
          name: "Admin A",
          email: `a-${Date.now()}@test.local`,
          passwordHash: "test",
          role: "ADMIN",
        },
      }),
      db!.user.create({
        data: {
          organizationId: b.id,
          name: "Admin B",
          email: `b-${Date.now()}@test.local`,
          passwordHash: "test",
          role: "ADMIN",
        },
      }),
      db!.client.create({ data: { organizationId: a.id, name: "Client A" } }),
      db!.client.create({ data: { organizationId: b.id, name: "Client B" } }),
    ]);
    const projectA = await db!.project.create({
      data: { organizationId: a.id, clientId: clientA.id, name: "Project A" },
    });
    const taskA = await db!.task.create({
      data: { organizationId: a.id, projectId: projectA.id, title: "Task A" },
    });
    return { a, b, userA, userB, clientA, clientB, projectA, taskA };
  }

  it("does not return foreign clients, projects, or tasks through tenant-scoped lookups", async () => {
    const data = await fixtures();
    expect(
      await db!.client.findFirst({
        where: { id: data.clientA.id, organizationId: data.b.id },
      }),
    ).toBeNull();
    expect(
      await db!.project.findFirst({
        where: { id: data.projectA.id, organizationId: data.b.id },
      }),
    ).toBeNull();
    expect(
      await db!.task.findFirst({
        where: { id: data.taskA.id, organizationId: data.b.id },
      }),
    ).toBeNull();
    expect(
      (
        await db!.task.updateMany({
          where: { id: data.taskA.id, organizationId: data.b.id },
          data: { title: "Compromised" },
        })
      ).count,
    ).toBe(0);
  });

  it("rejects cross-tenant project/client and project/member relations at the database boundary", async () => {
    const data = await fixtures();
    await expect(
      db!.project.create({
        data: {
          organizationId: data.b.id,
          clientId: data.clientA.id,
          name: "Invalid project",
        },
      }),
    ).rejects.toThrow();
    await expect(
      db!.projectMember.create({
        data: {
          organizationId: data.b.id,
          projectId: data.projectA.id,
          userId: data.userB.id,
        },
      }),
    ).rejects.toThrow();
    await expect(
      db!.task.update({
        where: { id: data.taskA.id },
        data: { assigneeId: data.userB.id },
      }),
    ).rejects.toThrow();
  });

  it("nulls assignments and preserves activity history when a user is deleted", async () => {
    const data = await fixtures();
    await db!.task.update({
      where: { id: data.taskA.id },
      data: { assigneeId: data.userA.id },
    });
    const log = await db!.activityLog.create({
      data: {
        organizationId: data.a.id,
        userId: data.userA.id,
        entityType: "CLIENT",
        entityId: data.clientA.id,
        action: "UPDATED",
        description: "Admin A updated Client A.",
      },
    });
    await db!.user.delete({ where: { id: data.userA.id } });
    expect(
      await db!.activityLog.findUnique({ where: { id: log.id } }),
    ).toMatchObject({ userId: null, description: "Admin A updated Client A." });
    expect(
      await db!.task.findUnique({ where: { id: data.taskA.id } }),
    ).toMatchObject({ assigneeId: null, organizationId: data.a.id });
  });
});
