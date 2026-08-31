export type AppRole = "ADMIN" | "EMPLOYEE";

export function canManageClients(role: AppRole) {
  return role === "ADMIN";
}
export function canManageProjects(role: AppRole) {
  return role === "ADMIN";
}
export function canManageTasks(role: AppRole) {
  return role === "ADMIN";
}
export function canUpdateTaskStatus(role: AppRole) {
  return role === "ADMIN" || role === "EMPLOYEE";
}
export function canManageOrganization(role: AppRole) {
  return role === "ADMIN";
}

export const taskPriorityWeight = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const;
export const projectPriorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 } as const;
