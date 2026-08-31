import { describe, expect, it } from "vitest";
import {
  canManageClients,
  canManageOrganization,
  canManageProjects,
  canManageTasks,
  canUpdateTaskStatus,
  projectPriorityWeight,
  taskPriorityWeight,
} from "@/lib/permissions";

describe("permissions and priority helpers", () => {
  it("keeps management operations admin-only", () => {
    expect(canManageClients("ADMIN")).toBe(true);
    expect(canManageProjects("EMPLOYEE")).toBe(false);
    expect(canManageTasks("EMPLOYEE")).toBe(false);
    expect(canManageOrganization("EMPLOYEE")).toBe(false);
    expect(canUpdateTaskStatus("EMPLOYEE")).toBe(true);
  });

  it("uses business priority ordering instead of alphabetic order", () => {
    expect(taskPriorityWeight.URGENT).toBeGreaterThan(taskPriorityWeight.HIGH);
    expect(projectPriorityWeight.HIGH).toBeGreaterThan(
      projectPriorityWeight.MEDIUM,
    );
  });
});
