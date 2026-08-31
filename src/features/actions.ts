"use server";

import { Prisma, type TaskStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { requireAdmin, requireUser, taskScope } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";
import { calculateBoardPosition } from "@/lib/board";
import {
  clientSchema,
  moveTaskSchema,
  organizationSchema,
  profileSchema,
  projectSchema,
  taskSchema,
} from "@/lib/validations";
import type { ActionResult } from "@/types/actions";

function validationError(error: {
  flatten(): { fieldErrors: Record<string, string[]> };
}): ActionResult {
  return {
    success: false,
    code: "VALIDATION",
    message: "Check the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function unknownError(message: string): ActionResult {
  return { success: false, code: "UNKNOWN", message };
}

export async function saveClientAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAdmin();
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { id, ...value } = parsed.data;
  try {
    if (id) {
      const existing = await prisma.client.findFirst({
        where: { id, organizationId: user.organizationId },
      });
      if (!existing)
        return {
          success: false,
          code: "NOT_FOUND",
          message: "Client not found.",
        };
      await prisma.$transaction(async (tx) => {
        await tx.client.update({
          where: { id },
          data: {
            ...value,
            email: value.email || null,
            company: value.company || null,
            phone: value.phone || null,
            address: value.address || null,
            notes: value.notes || null,
          },
        });
        await logActivity(tx, {
          organizationId: user.organizationId,
          userId: user.id,
          entityType: "CLIENT",
          entityId: id,
          action: "UPDATED",
          description: `${user.name} updated client “${value.name}”.`,
        });
      });
      revalidatePath("/clients");
      revalidatePath(`/clients/${id}`);
      return { success: true, data: { id }, message: "Client updated." };
    }
    const created = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          ...value,
          organizationId: user.organizationId,
          email: value.email || null,
          company: value.company || null,
          phone: value.phone || null,
          address: value.address || null,
          notes: value.notes || null,
        },
      });
      await logActivity(tx, {
        organizationId: user.organizationId,
        userId: user.id,
        entityType: "CLIENT",
        entityId: client.id,
        action: "CREATED",
        description: `${user.name} created client “${client.name}”.`,
      });
      return client;
    });
    revalidatePath("/clients");
    return {
      success: true,
      data: { id: created.id },
      message: "Client created successfully.",
    };
  } catch {
    return unknownError("Something went wrong while saving the client.");
  }
}

export async function deleteClientAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const client = await prisma.client.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { _count: { select: { projects: true } } },
  });
  if (!client)
    return { success: false, code: "NOT_FOUND", message: "Client not found." };
  if (client._count.projects > 0)
    return {
      success: false,
      code: "CONFLICT",
      message: "Unable to delete this client because it has projects.",
    };
  await prisma.$transaction(async (tx) => {
    await tx.client.delete({ where: { id } });
    await logActivity(tx, {
      organizationId: user.organizationId,
      userId: user.id,
      entityType: "CLIENT",
      entityId: id,
      action: "DELETED",
      description: `${user.name} deleted client “${client.name}”.`,
    });
  });
  revalidatePath("/clients");
  return { success: true, message: "Client deleted." };
}

export async function saveProjectAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { id, memberIds, budget, startDate, deadline, ...value } = parsed.data;
  const uniqueMemberIds = [...new Set(memberIds)];
  const [client, memberCount] = await Promise.all([
    prisma.client.findFirst({
      where: { id: value.clientId, organizationId: user.organizationId },
      select: { id: true },
    }),
    prisma.user.count({
      where: {
        id: { in: uniqueMemberIds },
        organizationId: user.organizationId,
      },
    }),
  ]);
  if (!client || memberCount !== uniqueMemberIds.length)
    return {
      success: false,
      code: "VALIDATION",
      message: "Client and members must belong to your organization.",
    };
  try {
    if (id) {
      const existing = await prisma.project.findFirst({
        where: { id, organizationId: user.organizationId },
        include: { members: true },
      });
      if (!existing)
        return {
          success: false,
          code: "NOT_FOUND",
          message: "Project not found.",
        };
      await prisma.$transaction(async (tx) => {
        const removed = existing.members
          .filter((member) => !uniqueMemberIds.includes(member.userId))
          .map((member) => member.userId);
        if (removed.length)
          await tx.task.updateMany({
            where: { projectId: id, assigneeId: { in: removed } },
            data: { assigneeId: null },
          });
        await tx.project.update({
          where: { id },
          data: {
            ...value,
            budget: budget ? new Prisma.Decimal(budget) : null,
            startDate: parseDateInput(startDate),
            deadline: parseDateInput(deadline),
            members: {
              deleteMany: {},
              create: uniqueMemberIds.map((userId) => ({
                userId,
                organizationId: user.organizationId,
              })),
            },
          },
        });
        await logActivity(tx, {
          organizationId: user.organizationId,
          userId: user.id,
          entityType: "PROJECT",
          entityId: id,
          action:
            existing.status === value.status ? "UPDATED" : "STATUS_CHANGED",
          description:
            existing.status === value.status
              ? `${user.name} updated project “${value.name}”.`
              : `${user.name} changed project “${value.name}” from ${existing.status} to ${value.status}.`,
          metadata:
            existing.status === value.status
              ? undefined
              : { previous: existing.status, next: value.status },
        });
      });
      revalidatePath("/projects");
      revalidatePath(`/projects/${id}`);
      revalidatePath("/tasks");
      return { success: true, data: { id }, message: "Project updated." };
    }
    const created = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ...value,
          organizationId: user.organizationId,
          budget: budget ? new Prisma.Decimal(budget) : null,
          startDate: parseDateInput(startDate),
          deadline: parseDateInput(deadline),
          members: {
            create: uniqueMemberIds.map((userId) => ({
              userId,
              organizationId: user.organizationId,
            })),
          },
        },
      });
      await logActivity(tx, {
        organizationId: user.organizationId,
        userId: user.id,
        entityType: "PROJECT",
        entityId: project.id,
        action: "CREATED",
        description: `${user.name} created project “${project.name}”.`,
      });
      return project;
    });
    revalidatePath("/projects");
    return {
      success: true,
      data: { id: created.id },
      message: "Project created.",
    };
  } catch {
    return unknownError("Something went wrong while saving the project.");
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const project = await prisma.project.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!project)
    return { success: false, code: "NOT_FOUND", message: "Project not found." };
  await prisma.$transaction(async (tx) => {
    await tx.project.delete({ where: { id } });
    await logActivity(tx, {
      organizationId: user.organizationId,
      userId: user.id,
      entityType: "PROJECT",
      entityId: id,
      action: "DELETED",
      description: `${user.name} deleted project “${project.name}” and its tasks.`,
    });
  });
  revalidatePath("/projects");
  revalidatePath("/tasks");
  revalidatePath("/board");
  return { success: true, message: "Project deleted." };
}

export async function saveTaskAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAdmin();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { id, assigneeId, deadline, ...value } = parsed.data;
  const project = await prisma.project.findFirst({
    where: { id: value.projectId, organizationId: user.organizationId },
    select: { id: true },
  });
  if (!project)
    return {
      success: false,
      code: "VALIDATION",
      message: "Select a project in your organization.",
    };
  if (assigneeId) {
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: value.projectId,
        userId: assigneeId,
        organizationId: user.organizationId,
      },
    });
    if (!member)
      return {
        success: false,
        code: "VALIDATION",
        message: "Assignee must be a project member.",
        fieldErrors: { assigneeId: ["Assignee must be a project member."] },
      };
  }
  try {
    if (id) {
      const existing = await prisma.task.findFirst({
        where: { id, organizationId: user.organizationId },
      });
      if (!existing)
        return {
          success: false,
          code: "NOT_FOUND",
          message: "Task not found.",
        };
      await prisma.$transaction(async (tx) => {
        await tx.task.update({
          where: { id },
          data: {
            ...value,
            assigneeId: assigneeId || null,
            deadline: parseDateInput(deadline),
          },
        });
        const statusChanged = existing.status !== value.status;
        await logActivity(tx, {
          organizationId: user.organizationId,
          userId: user.id,
          entityType: "TASK",
          entityId: id,
          action: statusChanged ? "STATUS_CHANGED" : "UPDATED",
          description: statusChanged
            ? `${user.name} changed task “${value.title}” from ${existing.status} to ${value.status}.`
            : `${user.name} updated task “${value.title}”.`,
          metadata: statusChanged
            ? {
                previous: existing.status,
                next: value.status,
                projectId: value.projectId,
              }
            : { projectId: value.projectId },
        });
      });
      revalidatePath("/tasks");
      revalidatePath("/board");
      revalidatePath(`/projects/${value.projectId}`);
      return { success: true, data: { id }, message: "Task updated." };
    }
    const max = await prisma.task.aggregate({
      where: { organizationId: user.organizationId, status: value.status },
      _max: { position: true },
    });
    const created = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          ...value,
          organizationId: user.organizationId,
          assigneeId: assigneeId || null,
          deadline: parseDateInput(deadline),
          position: (max._max.position ?? 0) + 1000,
        },
      });
      await logActivity(tx, {
        organizationId: user.organizationId,
        userId: user.id,
        entityType: "TASK",
        entityId: task.id,
        action: "CREATED",
        description: `${user.name} created task “${task.title}”.`,
        metadata: { projectId: task.projectId },
      });
      return task;
    });
    revalidatePath("/tasks");
    revalidatePath("/board");
    revalidatePath(`/projects/${value.projectId}`);
    return {
      success: true,
      data: { id: created.id },
      message: "Task created.",
    };
  } catch {
    return unknownError("Something went wrong while saving the task.");
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const task = await prisma.task.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!task)
    return { success: false, code: "NOT_FOUND", message: "Task not found." };
  await prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id } });
    await logActivity(tx, {
      organizationId: user.organizationId,
      userId: user.id,
      entityType: "TASK",
      entityId: id,
      action: "DELETED",
      description: `${user.name} deleted task “${task.title}”.`,
      metadata: { projectId: task.projectId },
    });
  });
  revalidatePath("/tasks");
  revalidatePath("/board");
  revalidatePath(`/projects/${task.projectId}`);
  return { success: true, message: "Task deleted." };
}

export async function updateTaskStatusAction(
  id: string,
  status: TaskStatus,
): Promise<ActionResult> {
  return moveTaskAction({ taskId: id, destinationStatus: status });
}

export async function moveTaskAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { taskId, destinationStatus, beforeTaskId, afterTaskId } = parsed.data;
  const scope = taskScope(user);
  const task = await prisma.task.findFirst({ where: { id: taskId, ...scope } });
  if (!task)
    return { success: false, code: "NOT_FOUND", message: "Task not found." };
  const neighbors = await prisma.task.findMany({
    where: {
      id: { in: [beforeTaskId, afterTaskId].filter(Boolean) as string[] },
      status: destinationStatus,
      ...scope,
    },
    select: { id: true, position: true },
  });
  if (
    (beforeTaskId && !neighbors.some((item) => item.id === beforeTaskId)) ||
    (afterTaskId && !neighbors.some((item) => item.id === afterTaskId))
  )
    return {
      success: false,
      code: "NOT_FOUND",
      message: "Board position is no longer available. Refresh and try again.",
    };
  const before = neighbors.find((item) => item.id === beforeTaskId)?.position;
  const after = neighbors.find((item) => item.id === afterTaskId)?.position;
  let position = calculateBoardPosition(before, after);
  if (position === null) {
    const ordered = await prisma.task.findMany({
      where: { status: destinationStatus, ...scope, id: { not: taskId } },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    await prisma.$transaction(
      ordered.map((item, index) =>
        prisma.task.update({
          where: { id: item.id },
          data: { position: (index + 1) * 1000 },
        }),
      ),
    );
    const beforeIndex = beforeTaskId
      ? ordered.findIndex((item) => item.id === beforeTaskId)
      : -1;
    position = beforeIndex >= 0 ? (beforeIndex + 1) * 1000 + 500 : 500;
  }
  await prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id: task.id },
      data: { status: destinationStatus, position: position ?? 1000 },
    });
    if (task.status !== destinationStatus)
      await logActivity(tx, {
        organizationId: user.organizationId,
        userId: user.id,
        entityType: "TASK",
        entityId: task.id,
        action: "STATUS_CHANGED",
        description: `${user.name} changed task “${task.title}” from ${task.status} to ${destinationStatus}.`,
        metadata: {
          previous: task.status,
          next: destinationStatus,
          projectId: task.projectId,
        },
      });
  });
  revalidatePath("/board");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath("/dashboard");
  return { success: true, message: `Task moved to ${destinationStatus}.` };
}

export async function updateProfileAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name, jobTitle: parsed.data.jobTitle || null },
    });
    await logActivity(tx, {
      organizationId: user.organizationId,
      userId: user.id,
      entityType: "USER",
      entityId: user.id,
      action: "UPDATED",
      description: `${parsed.data.name} updated their profile.`,
    });
  });
  revalidatePath("/settings/profile");
  revalidatePath("/team");
  return { success: true, message: "Profile updated." };
}

export async function updateOrganizationAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: user.organizationId },
      data: { name: parsed.data.name },
    });
    await logActivity(tx, {
      organizationId: user.organizationId,
      userId: user.id,
      entityType: "ORGANIZATION",
      entityId: user.organizationId,
      action: "UPDATED",
      description: `${user.name} renamed the organization to “${parsed.data.name}”.`,
    });
  });
  revalidatePath("/settings/organization");
  return { success: true, message: "Organization updated." };
}
