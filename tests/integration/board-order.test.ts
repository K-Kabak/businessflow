import { readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskStatus } from "@/generated/prisma/client";

const session = vi.hoisted(() => ({ user: { id: "", organizationId: "" } }));
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

import { prisma as db } from "@/lib/db";
import {
  moveTaskAction,
  saveTaskAction,
  updateTaskStatusAction,
} from "@/features/actions";
import { placeTask, serializable } from "@/lib/board-order";
import { requireUser } from "@/lib/auth-helpers";

const suite = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const slugs = ["board-order-a", "board-order-b"];
const orderBy = [
  { position: "asc" },
  { createdAt: "asc" },
  { id: "asc" },
] as const;

suite("project-scoped board ordering", () => {
  beforeEach(async () => {
    await db.organization.deleteMany({ where: { slug: { in: slugs } } });
  });
  afterAll(async () => {
    await db.organization.deleteMany({ where: { slug: { in: slugs } } });
    await db.$disconnect();
  });

  async function fixture() {
    const a = await db.organization.create({
      data: { name: "Board A", slug: slugs[0] },
    });
    const b = await db.organization.create({
      data: { name: "Board B", slug: slugs[1] },
    });
    const admin = await db.user.create({
      data: {
        organizationId: a.id,
        name: "Admin",
        email: "board-admin@test.local",
        passwordHash: "test",
        role: "ADMIN",
      },
    });
    const employee = await db.user.create({
      data: {
        organizationId: a.id,
        name: "Employee",
        email: "board-employee@test.local",
        passwordHash: "test",
      },
    });
    async function project(organizationId: string, name: string) {
      const client = await db.client.create({ data: { organizationId, name } });
      return db.project.create({
        data: { organizationId, clientId: client.id, name },
      });
    }
    const p = await project(a.id, "Assigned");
    const other = await project(a.id, "Other");
    const foreign = await project(b.id, "Foreign");
    await db.projectMember.create({
      data: { organizationId: a.id, projectId: p.id, userId: employee.id },
    });
    session.user = { id: admin.id, organizationId: a.id };
    async function task(
      title: string,
      position: number,
      status: TaskStatus = "TODO",
      target = p,
      assigneeId: string | null = null,
    ) {
      return db.task.create({
        data: {
          title,
          position,
          status,
          projectId: target.id,
          organizationId: target.organizationId,
          assigneeId,
        },
      });
    }
    const tasks = [];
    for (let i = 0; i < 4; i++)
      tasks.push(
        await task(
          `Task ${i}`,
          (i + 1) * 1000,
          "TODO",
          p,
          i % 2 === 0 ? employee.id : null,
        ),
      );
    const otherTask = await task("Other task", 777, "TODO", other);
    const foreignTask = await task("Foreign task", 777, "TODO", foreign);
    const column = (status: TaskStatus = "TODO", projectId = p.id) =>
      db.task.findMany({
        where: { organizationId: a.id, projectId, status },
        orderBy: [...orderBy],
      });
    return {
      a,
      admin,
      employee,
      p,
      other,
      foreign,
      tasks,
      otherTask,
      foreignTask,
      task,
      column,
    };
  }

  it("persists beginning, middle and end moves without touching other projects or tenants", async () => {
    const f = await fixture();
    const [a, b, c, d] = f.tasks;
    for (const [input, expected] of [
      [{ taskId: d.id, afterTaskId: a.id }, [d, a, b, c]],
      [{ taskId: d.id, beforeTaskId: a.id, afterTaskId: b.id }, [a, d, b, c]],
      [{ taskId: d.id, beforeTaskId: c.id }, [a, b, c, d]],
    ] as const) {
      expect(
        await moveTaskAction({ ...input, destinationStatus: "TODO" }),
      ).toMatchObject({ success: true });
      const persisted = await f.column();
      expect(persisted.map((t) => t.id)).toEqual(expected.map((t) => t.id));
      expect(persisted.map((t) => t.position)).toEqual([
        1000, 2000, 3000, 4000,
      ]);
    }
    for (const task of [f.otherTask, f.foreignTask])
      expect(
        await db.task.findFirst({
          where: { id: task.id, organizationId: task.organizationId },
        }),
      ).toEqual(task);
    expect(
      await db.activityLog.count({ where: { organizationId: f.a.id } }),
    ).toBe(0);
  });

  it("preserves hidden-card order for assignee/My tasks filters and nonadjacent anchors", async () => {
    const f = await fixture();
    session.user.id = f.employee.id;
    const [a, hidden, b, tail] = f.tasks;
    const moved = await f.task(
      "Visible moved",
      5000,
      "TODO",
      f.p,
      f.employee.id,
    );
    expect(
      await moveTaskAction({
        taskId: moved.id,
        destinationStatus: "TODO",
        beforeTaskId: a.id,
        afterTaskId: b.id,
      }),
    ).toMatchObject({ success: true });
    const result = await f.column();
    expect(result.map((t) => t.id)).toEqual([
      a.id,
      hidden.id,
      moved.id,
      b.id,
      tail.id,
    ]);
    expect(
      result.filter((t) => t.assigneeId === f.employee.id).map((t) => t.id),
    ).toEqual([a.id, moved.id, b.id]);
    expect(result.find((t) => t.id === hidden.id)).toMatchObject({
      status: hidden.status,
      assigneeId: hidden.assigneeId,
    });
  });

  it("appends status-only moves, handles empty columns, logs once and preserves no-op state", async () => {
    const f = await fixture();
    const [a, b] = f.tasks;
    expect(await updateTaskStatusAction(a.id, "DONE")).toMatchObject({
      success: true,
    });
    expect(await updateTaskStatusAction(b.id, "DONE")).toMatchObject({
      success: true,
    });
    const before = await f.column("DONE");
    expect(before.map((t) => t.id)).toEqual([a.id, b.id]);
    expect(await updateTaskStatusAction(a.id, "DONE")).toMatchObject({
      success: true,
    });
    expect(await f.column("DONE")).toEqual(before);
    expect(
      await db.activityLog.count({
        where: { organizationId: f.a.id, action: "STATUS_CHANGED" },
      }),
    ).toBe(2);
  });

  it("rejects inaccessible resources and malformed anchors with no writes", async () => {
    const f = await fixture();
    session.user.id = f.employee.id;
    const [a, b, c] = f.tasks;
    const before = await f.column();
    for (const input of [
      { taskId: f.foreignTask.id },
      { taskId: f.otherTask.id },
      { taskId: a.id, afterTaskId: f.foreignTask.id },
      { taskId: a.id, afterTaskId: f.otherTask.id },
      { taskId: a.id, afterTaskId: a.id },
      { taskId: a.id, beforeTaskId: b.id, afterTaskId: b.id },
      { taskId: a.id, beforeTaskId: c.id, afterTaskId: b.id },
      { taskId: a.id, destinationStatus: "DONE", afterTaskId: b.id },
    ])
      expect(
        await moveTaskAction({ destinationStatus: "TODO", ...input }),
      ).toMatchObject({ success: false, code: "NOT_FOUND" });
    expect(await f.column()).toEqual(before);
    expect(
      await db.activityLog.count({ where: { organizationId: f.a.id } }),
    ).toBe(0);
    await expect(saveTaskAction({})).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("uses project-local append for create and form edits, preserving unchanged ranks", async () => {
    const f = await fixture();
    const input = {
      title: "Created",
      projectId: f.p.id,
      status: "TODO",
      priority: "MEDIUM",
    };
    const created = await saveTaskAction(input);
    expect(created.success).toBe(true);
    if (!created.success || !created.data) throw new Error("Creation failed");
    const id = created.data.id;
    expect((await f.column()).at(-1)).toMatchObject({ id, position: 5000 });
    expect(
      await saveTaskAction({ ...input, id, title: "Renamed" }),
    ).toMatchObject({ success: true });
    expect((await f.column()).at(-1)).toMatchObject({ id, position: 5000 });
    expect(
      await saveTaskAction({ ...input, id, status: "DONE" }),
    ).toMatchObject({ success: true });
    expect(await f.column("DONE")).toMatchObject([{ id, position: 1000 }]);
    expect(
      await saveTaskAction({ ...input, id, projectId: f.other.id }),
    ).toMatchObject({ success: true });
    expect((await f.column("TODO", f.other.id)).map((t) => t.id)).toEqual([
      f.otherTask.id,
      id,
    ]);
    expect(
      await saveTaskAction({ ...input, id: f.foreignTask.id }),
    ).toMatchObject({ success: false, code: "NOT_FOUND" });
  });

  it("rolls back all ranks and status when a later operation fails", async () => {
    const f = await fixture();
    const user = await requireUser();
    const before = await f.column();
    await expect(
      serializable(async (tx) => {
        await placeTask(tx, user, f.tasks[3], "TODO", null, f.tasks[0].id);
        await tx.activityLog.create({
          data: {
            organizationId: "missing-organization",
            entityType: "TASK",
            action: "STATUS_CHANGED",
            description: "Failure",
          },
        });
      }),
    ).rejects.toThrow();
    expect(await f.column()).toEqual(before);
  });

  it("serializes concurrent moves without duplicate ranks or logs", async () => {
    const f = await fixture();
    const results = await Promise.all(
      f.tasks.map((t) => updateTaskStatusAction(t.id, "DONE")),
    );
    expect(results.every((r) => r.success)).toBe(true);
    const column = await f.column("DONE");
    expect(column).toHaveLength(4);
    expect(column.map((t) => t.position)).toEqual([1000, 2000, 3000, 4000]);
    expect(
      await db.activityLog.count({
        where: { organizationId: f.a.id, action: "STATUS_CHANGED" },
      }),
    ).toBe(4);
  });

  it("normalizes legacy duplicates deterministically using the migration SQL", async () => {
    const f = await fixture();
    await db.task.updateMany({
      where: { organizationId: f.a.id, projectId: f.p.id },
      data: { position: 7, createdAt: new Date("2026-01-01") },
    });
    const sql = readFileSync(
      "prisma/migrations/20260917120000_project_board_order/migration.sql",
      "utf8",
    );
    const before = await f.column();
    // Run only the data statement inside a rolled-back transaction; the deployed index already exists.
    await expect(
      db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(sql.split("CREATE INDEX")[0]);
        const after = await tx.task.findMany({
          where: { organizationId: f.a.id, projectId: f.p.id },
          orderBy: [...orderBy],
        });
        expect(after.map((t) => t.id)).toEqual(before.map((t) => t.id));
        expect(after.map((t) => t.position)).toEqual([1000, 2000, 3000, 4000]);
        expect(after.map((task) => ({ ...task, position: 0 }))).toEqual(
          before.map((task) => ({ ...task, position: 0 })),
        );
        throw new Error("rollback migration test");
      }),
    ).rejects.toThrow("rollback migration test");
  });
});
