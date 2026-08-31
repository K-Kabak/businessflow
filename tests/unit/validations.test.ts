import { describe, expect, it } from "vitest";
import { clientSchema, projectSchema, taskSchema } from "@/lib/validations";

describe("resource schemas", () => {
  it("accepts a valid client and rejects a malformed email", () => {
    expect(
      clientSchema.safeParse({
        name: "Nova Studio",
        status: "ACTIVE",
        email: "hello@nova.example",
      }).success,
    ).toBe(true);
    expect(
      clientSchema.safeParse({
        name: "Nova Studio",
        status: "ACTIVE",
        email: "not-an-email",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid project budgets and date ranges", () => {
    const base = {
      clientId: "client",
      name: "Website",
      status: "PLANNING",
      priority: "MEDIUM",
      memberIds: [],
    };
    expect(projectSchema.safeParse({ ...base, budget: "-1" }).success).toBe(
      false,
    );
    expect(
      projectSchema.safeParse({
        ...base,
        startDate: "2026-09-10",
        deadline: "2026-09-01",
      }).success,
    ).toBe(false);
  });

  it("requires task title and a project", () => {
    expect(
      taskSchema.safeParse({
        title: "",
        projectId: "",
        status: "TODO",
        priority: "MEDIUM",
      }).success,
    ).toBe(false);
    expect(
      taskSchema.safeParse({
        title: "Prepare brief",
        projectId: "project",
        status: "TODO",
        priority: "MEDIUM",
      }).success,
    ).toBe(true);
  });
});
