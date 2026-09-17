import { describe, expect, it } from "vitest";

import { requireE2eDatabase } from "../e2e/global-setup";

describe("E2E database safety", () => {
  it("accepts only the dedicated E2E database", () => {
    const url =
      "postgresql://businessflow:businessflow@localhost:5432/businessflow_e2e?schema=public";
    expect(requireE2eDatabase(url)).toBe(url);
    expect(() => requireE2eDatabase(undefined)).toThrow("must be configured");
    expect(() =>
      requireE2eDatabase(
        "postgresql://businessflow:businessflow@localhost:5432/businessflow?schema=public",
      ),
    ).toThrow("Refusing to prepare database");
  });
});
