"use server";

import { Prisma, type TaskStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

import { requireAdmin, requireUser, taskScope } from "@/lib/auth-helpers";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";
import { BoardOrderError, placeTask, serializable } from "@/lib/board-order";
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
  const [client, members] = await Promise.all([
    prisma.client.findFirst({
      where: { id: value.clientId, organizationId: user.organizationId },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: {
        id: { in: uniqueMemberIds },
        organizationId: user.organizationId,
      },
      select: { id: true, name: true },
    }),
  ]);
  if (!client || members.length !== uniqueMemberIds.length)
    return {
      success: false,
      code: "VALIDATION",
      message: "Client and members must belong to your organization.",
    };
  try {
    if (id) {
      const existing = await prisma.project.findFirst({
        where: { id, organizationId: user.organizationId },
        include: {
          members: { include: { user: { select: { name: true } } } },
        },
      });
      if (!existing)
        return {
          success: false,
          code: "NOT_FOUND",
          message: "Project not found.",
        };
      const previousMemberIds = new Set(
        existing.members.map((member) => member.userId),
      );
      const addedMemberIds = uniqueMemberIds.filter(
        (memberId) => !previousMemberIds.has(memberId),
      );
      const removedMemberIds = existing.members
        .filter((member) => !uniqueMemberIds.includes(member.userId))
        .map((member) => member.userId);
      const memberNames = new Map(
        members.map((member) => [member.id, member.name]),
      );
      for (const member of existing.members)
        memberNames.set(member.userId, member.user.name);
      await prisma.$transaction(async (tx) => {
        if (removedMemberIds.length)
          await tx.task.updateMany({
            where: {
              organizationId: user.organizationId,
              projectId: id,
              assigneeId: { in: removedMemberIds },
            },
            data: { assigneeId: null },
          });
        if (removedMemberIds.length)
          await tx.projectMember.deleteMany({
            where: {
              organizationId: user.organizationId,
              projectId: id,
              userId: { in: removedMemberIds },
            },
          });
        await tx.project.update({
          where: { id },
          data: {
            ...value,
            budget: budget ? new Prisma.Decimal(budget) : null,
            startDate: parseDateInput(startDate),
            deadline: parseDateInput(deadline),
          },
        });
        if (addedMemberIds.length)
          await tx.projectMember.createMany({
            data: addedMemberIds.map((userId) => ({
              projectId: id,
              userId,
              organizationId: user.organizationId,
            })),
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
        for (const memberId of addedMemberIds) {
          await logActivity(tx, {
            organizationId: user.organizationId,
            userId: user.id,
            entityType: "PROJECT",
            entityId: id,
            action: "ASSIGNED",
            description: `${user.name} added ${memberNames.get(memberId)} to project “${value.name}”.`,
            metadata: { projectId: id, memberId, membershipChange: "ADDED" },
          });
        }
        for (const memberId of removedMemberIds) {
          await logActivity(tx, {
            organizationId: user.organizationId,
            userId: user.id,
            entityType: "PROJECT",
            entityId: id,
            action: "ASSIGNED",
            description: `${user.name} removed ${memberNames.get(memberId)} from project “${value.name}”.`,
            metadata: {
              projectId: id,
              memberId,
              membershipChange: "REMOVED",
            },
          });
        }
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
        },
      });
      if (uniqueMemberIds.length)
        await tx.projectMember.createMany({
          data: uniqueMemberIds.map((userId) => ({
            projectId: project.id,
            userId,
            organizationId: user.organizationId,
          })),
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
  try {
    const result = await serializable<
      ActionResult<{ id: string; previousProjectId?: string }>
    >(async (tx) => {
      const project = await tx.project.findFirst({
        where: { id: value.projectId, organizationId: user.organizationId },
        select: { id: true },
      });
      if (!project)
        return {
          success: false,
          code: "VALIDATION",
          message: "Select a project in your organization.",
        };
      let assigneeName: string | null = null;
      if (assigneeId) {
        const member = await tx.projectMember.findFirst({
          where: {
            projectId: value.projectId,
            userId: assigneeId,
            organizationId: user.organizationId,
          },
          select: { user: { select: { name: true } } },
        });
        if (!member)
          return {
            success: false,
            code: "VALIDATION",
            message: "Assignee must be a project member.",
            fieldErrors: { assigneeId: ["Assignee must be a project member."] },
          };
        assigneeName = member.user.name;
      }
      if (id) {
        const existing = await tx.task.findFirst({
          where: { id, organizationId: user.organizationId },
          include: { assignee: { select: { name: true } } },
        });
        if (!existing)
          return {
            success: false,
            code: "NOT_FOUND",
            message: "Task not found.",
          };
        const nextAssigneeId = assigneeId || null;
        const assigneeChanged = existing.assigneeId !== nextAssigneeId;
        {
          await tx.task.update({
            where: { id },
            data: {
              ...value,
              assigneeId: nextAssigneeId,
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
          if (assigneeChanged) {
            const description = existing.assignee
              ? assigneeName
                ? `${user.name} reassigned task “${value.title}” from ${existing.assignee.name} to ${assigneeName}.`
                : `${user.name} unassigned ${existing.assignee.name} from task “${value.title}”.`
              : `${user.name} assigned task “${value.title}” to ${assigneeName}.`;
            await logActivity(tx, {
              organizationId: user.organizationId,
              userId: user.id,
              entityType: "TASK",
              entityId: id,
              action: "ASSIGNED",
              description,
              metadata: {
                previousAssigneeId: existing.assigneeId,
                nextAssigneeId,
                projectId: value.projectId,
              },
            });
          }
        }
        if (
          existing.projectId !== value.projectId ||
          existing.status !== value.status
        ) {
          await placeTask(
            tx,
            user,
            { id, projectId: value.projectId },
            value.status,
          );
        }
        return {
          success: true,
          data: { id, previousProjectId: existing.projectId },
          message: "Task updated.",
        };
      }
      {
        const task = await tx.task.create({
          data: {
            ...value,
            organizationId: user.organizationId,
            assigneeId: assigneeId || null,
            deadline: parseDateInput(deadline),
            position: 1000,
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
        if (assigneeId) {
          await logActivity(tx, {
            organizationId: user.organizationId,
            userId: user.id,
            entityType: "TASK",
            entityId: task.id,
            action: "ASSIGNED",
            description: `${user.name} assigned task “${task.title}” to ${assigneeName}.`,
            metadata: {
              previousAssigneeId: null,
              nextAssigneeId: assigneeId,
              projectId: task.projectId,
            },
          });
        }
        await placeTask(tx, user, task, task.status);
        return {
          success: true,
          data: { id: task.id },
          message: "Task created.",
        };
      }
    });
    if (result.success) {
      revalidatePath("/tasks");
      revalidatePath("/board");
      revalidatePath("/dashboard");
      revalidatePath(`/projects/${value.projectId}`);
      if (result.data?.previousProjectId)
        revalidatePath(`/projects/${result.data.previousProjectId}`);
    }
    return result;
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
  try {
    const projectId = await serializable(async (tx) => {
      const task = await tx.task.findFirst({
        where: { id: taskId, ...taskScope(user) },
      });
      if (!task) throw new BoardOrderError("Task not found.");
      if (task.status === destinationStatus && !beforeTaskId && !afterTaskId)
        return task.projectId;
      await placeTask(
        tx,
        user,
        task,
        destinationStatus,
        beforeTaskId,
        afterTaskId,
      );
      if (task.status !== destinationStatus) {
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
      }
      return task.projectId;
    });
    revalidatePath("/board");
    revalidatePath("/tasks");
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true, message: "Board updated." };
  } catch (error) {
    if (error instanceof BoardOrderError)
      return { success: false, code: "NOT_FOUND", message: error.message };
    return {
      success: false,
      code: "CONFLICT",
      message: "Unable to save the board. Refresh and try again.",
    };
  }
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
