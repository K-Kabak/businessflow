import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DragEndEvent } from "@dnd-kit/core";

const mocks = vi.hoisted(() => ({
  move: vi.fn(),
  refresh: vi.fn(),
  error: vi.fn(),
  end: null as null | ((event: DragEndEvent) => void),
}));
vi.mock("@/features/actions", () => ({ moveTaskAction: mocks.move }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({ toast: { error: mocks.error, success: vi.fn() } }));
vi.mock("@dnd-kit/core", async (original) => {
  const actual = await original<typeof import("@dnd-kit/core")>();
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: (event: DragEndEvent) => void;
    }) => {
      mocks.end = onDragEnd;
      return <>{children}</>;
    },
  };
});
vi.mock("@dnd-kit/sortable", async (original) => {
  const actual = await original<typeof import("@dnd-kit/sortable")>();
  return {
    ...actual,
    useSortable: () => ({
      setNodeRef: vi.fn(),
      attributes: {},
      listeners: {},
      isDragging: false,
    }),
  };
});
import { KanbanBoard, type BoardTask } from "@/components/board/kanban-board";

const tasks: BoardTask[] = ["First", "Second"].map((title, i) => ({
  id: title,
  projectId: "project",
  title,
  status: "TODO",
  priority: "MEDIUM",
  deadline: null,
  position: (i + 1) * 1000,
  project: { name: "Project" },
  assignee: null,
}));
function drag(over = "Second") {
  mocks.end!({ active: { id: "First" }, over: { id: over } } as DragEndEvent);
}
describe("Kanban write controls", () => {
  beforeEach(() => {
    mocks.move.mockReset();
    mocks.refresh.mockReset();
    mocks.error.mockReset();
  });
  afterEach(cleanup);
  it("hides handles and rejects drag events in All projects", () => {
    render(<KanbanBoard initialTasks={tasks} />);
    expect(
      screen.getByText("Select a project to reorder tasks"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Move First" }),
    ).not.toBeInTheDocument();
    act(() => drag());
    expect(mocks.move).not.toHaveBeenCalled();
  });
  it("blocks overlapping drags and restores the pre-drag order on failure", async () => {
    let resolve!: (result: { success: false; message: string }) => void;
    mocks.move.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const { container } = render(<KanbanBoard initialTasks={tasks} canDrag />);
    expect(
      screen.getByRole("button", { name: "Move First" }),
    ).toBeInTheDocument();
    act(() => drag());
    expect(screen.getByText("Saving board…")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Move First" }),
    ).not.toBeInTheDocument();
    act(() => drag("DONE"));
    expect(mocks.move).toHaveBeenCalledTimes(1);
    await act(async () => resolve({ success: false, message: "Failed" }));
    const cards = [...container.querySelectorAll("article")];
    expect(cards[0]).toHaveTextContent("First");
    expect(cards[1]).toHaveTextContent("Second");
    expect(mocks.error).toHaveBeenCalledWith("Failed");
  });
  it("refreshes server state on success and handles rejected requests", async () => {
    mocks.move.mockResolvedValueOnce({ success: true });
    render(<KanbanBoard initialTasks={tasks} canDrag />);
    await act(async () => drag("DONE"));
    expect(mocks.move).toHaveBeenCalledWith({
      taskId: "First",
      destinationStatus: "DONE",
      beforeTaskId: null,
      afterTaskId: null,
    });
    expect(mocks.refresh).toHaveBeenCalledOnce();
    cleanup();
    mocks.move.mockRejectedValueOnce(new Error("offline"));
    render(<KanbanBoard initialTasks={tasks} canDrag />);
    await act(async () => drag());
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(
      screen.getByRole("button", { name: "Move First" }),
    ).toBeInTheDocument();
  });
});
