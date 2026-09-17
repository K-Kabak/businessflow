import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findFirst({
    where: { id: session.user.id, organizationId: session.user.organizationId },
    select: {
      id: true,
      organizationId: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      jobTitle: true,
    },
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();
  return user;
}

export async function canAccessProject(
  user: Awaited<ReturnType<typeof requireUser>>,
  projectId: string,
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: user.organizationId,
      ...(user.role === "EMPLOYEE"
        ? { members: { some: { userId: user.id } } }
        : {}),
    },
    select: { id: true },
  });
  return Boolean(project);
}

export function projectScope(user: Awaited<ReturnType<typeof requireUser>>) {
  return {
    organizationId: user.organizationId,
    ...(user.role === "EMPLOYEE"
      ? { members: { some: { userId: user.id } } }
      : {}),
  };
}

export function taskScope(user: Awaited<ReturnType<typeof requireUser>>) {
  return {
    organizationId: user.organizationId,
    ...(user.role === "EMPLOYEE"
      ? { project: { members: { some: { userId: user.id } } } }
      : {}),
  };
}

export function clientScope(user: Awaited<ReturnType<typeof requireUser>>) {
  return {
    organizationId: user.organizationId,
    ...(user.role === "EMPLOYEE"
      ? { projects: { some: { members: { some: { userId: user.id } } } } }
      : {}),
  };
}
