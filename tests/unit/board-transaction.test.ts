import { describe, expect, it, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("@/auth", () => ({ auth: vi.fn() }));
import { Prisma } from "@/generated/prisma/client";
import { serializable } from "@/lib/board-order";

describe("board transaction retry", () => {
  beforeEach(() => {
    mocks.transaction.mockReset();
  });
  const conflict = () =>
    new Prisma.PrismaClientKnownRequestError("conflict", {
      code: "P2034",
      clientVersion: "7.10.0",
    });
  it("retries serialization failures at most three times", async () => {
    mocks.transaction.mockRejectedValue(conflict());
    await expect(serializable(async () => "done")).rejects.toMatchObject({
      code: "P2034",
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(4);
    expect(mocks.transaction).toHaveBeenLastCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
  });
  it("returns the successful retry and never retries unrelated failures", async () => {
    mocks.transaction
      .mockRejectedValueOnce(conflict())
      .mockResolvedValueOnce("done");
    await expect(serializable(async () => "done")).resolves.toBe("done");
    expect(mocks.transaction).toHaveBeenCalledTimes(2);
    mocks.transaction
      .mockReset()
      .mockRejectedValue(new Error("database unavailable"));
    await expect(serializable(async () => "done")).rejects.toThrow(
      "database unavailable",
    );
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });
});
