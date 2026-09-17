"use client";
/* eslint-disable react-hooks/refs -- dnd-kit intentionally exposes callback refs during render. */

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/client";
import { CalendarDays, GripVertical } from "lucide-react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { moveTaskAction } from "@/features/actions";
import { formatDate } from "@/lib/format";
import { cn, isOverdue } from "@/lib/utils";

export type BoardTask = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  position: number;
  project: { name: string };
  assignee: { name: string } | null;
};
const columns: Array<{ id: TaskStatus; label: string }> = [
  { id: "TODO", label: "To do" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "REVIEW", label: "Review" },
  { id: "DONE", label: "Done" },
];

function TaskCardContent({
  task,
  dragHandle,
}: {
  task: BoardTask;
  dragHandle?: React.ComponentProps<"button">;
}) {
  return (
    <>
      <div className="flex items-start gap-2">
        {dragHandle ? (
          <button
            type="button"
            {...dragHandle}
            aria-label={`Move ${task.title}`}
            className="text-muted-foreground hover:bg-muted -m-1.5 grid size-8 shrink-0 cursor-grab place-items-center rounded-md active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5 font-medium">{task.title}</p>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {task.project.name}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 pl-7">
        <Badge value={task.priority} />
        {task.assignee ? (
          <Avatar name={task.assignee.name} size="sm" />
        ) : (
          <span className="text-muted-foreground text-xs">Unassigned</span>
        )}
      </div>
      {task.deadline ? (
        <p
          className={cn(
            "text-muted-foreground mt-3 flex items-center gap-1.5 pl-7 text-[11px]",
            isOverdue(new Date(task.deadline), task.status) &&
              "text-danger font-medium",
          )}
        >
          <CalendarDays className="size-3" />
          {formatDate(task.deadline)}
        </p>
      ) : null}
    </>
  );
}

function SortableTaskCard({
  task,
  disabled,
}: {
  task: BoardTask;
  disabled: boolean;
}) {
  const sortable = useSortable({
    id: task.id,
    disabled,
    data: { status: task.status },
  });
  return (
    <article
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      {...sortable.attributes}
      className={cn(
        "bg-card hover:border-border-strong rounded-md border p-3 transition-[border-color,box-shadow,opacity]",
        sortable.isDragging && "opacity-25",
      )}
    >
      <TaskCardContent
        task={task}
        dragHandle={disabled ? undefined : sortable.listeners}
      />
    </article>
  );
}

function Column({
  id,
  label,
  tasks,
  disabled,
}: {
  id: TaskStatus;
  label: string;
  tasks: BoardTask[];
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    disabled,
    data: { status: id },
  });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "bg-muted/70 flex h-full w-[min(85vw,304px)] shrink-0 snap-start flex-col rounded-lg border p-2.5 sm:w-[288px] xl:flex-1",
        isOver && "border-primary ring-primary/20 ring-2",
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1 py-1">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="bg-muted-foreground/55 size-1.5 rounded-full" />
          {label}
        </h2>
        <span className="bg-card text-muted-foreground rounded-full border px-2 py-0.5 text-[11px]">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={rectSortingStrategy}
      >
        <div className="min-h-24 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-0.5">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} disabled={disabled} />
          ))}
          {!tasks.length ? (
            <div className="text-muted-foreground bg-card/30 grid min-h-28 place-items-center rounded-md border border-dashed px-4 text-center text-xs">
              Drop tasks here
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

export function KanbanBoard({
  initialTasks,
  canDrag = false,
}: {
  initialTasks: BoardTask[];
  canDrag?: boolean;
}) {
  const router = useRouter();
  const saving = useRef(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const grouped = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [
          column.id,
          tasks
            .filter((task) => task.status === column.id)
            .sort(
              (a, b) =>
                a.projectId.localeCompare(b.projectId) ||
                a.position - b.position,
            ),
        ]),
      ) as Record<TaskStatus, BoardTask[]>,
    [tasks],
  );
  const activeTask = tasks.find((task) => task.id === activeId);
  function onDragStart(event: DragStartEvent) {
    if (!canDrag || saving.current) return;
    setActiveId(String(event.active.id));
  }
  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!canDrag || saving.current) return;
    if (!event.over) return;
    const taskId = String(event.active.id);
    const overId = String(event.over.id);
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;
    const overTask = tasks.find((task) => task.id === overId);
    if (overTask && overTask.projectId !== current.projectId) return;
    const previousTasks = tasks;
    const destinationStatus = (overTask?.status ??
      (columns.some((column) => column.id === overId)
        ? overId
        : current.status)) as TaskStatus;
    const destination = grouped[destinationStatus].filter(
      (task) => task.id !== taskId && task.projectId === current.projectId,
    );
    let index = overTask
      ? destination.findIndex((task) => task.id === overTask.id)
      : destination.length;
    if (index < 0) index = destination.length;
    if (current.status === destinationStatus) {
      const oldIndex = grouped[current.status].findIndex(
        (task) => task.id === taskId,
      );
      const targetIndex = overTask
        ? grouped[current.status].findIndex((task) => task.id === overTask.id)
        : grouped[current.status].length - 1;
      if (oldIndex === targetIndex) return;
      const reordered = arrayMove(
        grouped[current.status],
        oldIndex,
        targetIndex,
      );
      const positions = new Map(
        reordered.map((task, i) => [task.id, (i + 1) * 1000]),
      );
      setTasks((items) =>
        items.map((task) =>
          positions.has(task.id)
            ? { ...task, position: positions.get(task.id)! }
            : task,
        ),
      );
      index = reordered.findIndex((task) => task.id === taskId);
    } else {
      const inserted = [...destination];
      inserted.splice(index, 0, { ...current, status: destinationStatus });
      const positions = new Map(
        inserted.map((task, i) => [task.id, (i + 1) * 1000]),
      );
      setTasks((items) =>
        items.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: destinationStatus,
                position: positions.get(task.id)!,
              }
            : positions.has(task.id)
              ? { ...task, position: positions.get(task.id)! }
              : task,
        ),
      );
    }
    const projected = [...destination];
    projected.splice(index, 0, current);
    const beforeTaskId = index > 0 ? projected[index - 1]?.id : null;
    const afterTaskId =
      index < projected.length - 1 ? projected[index + 1]?.id : null;
    saving.current = true;
    startTransition(async () => {
      try {
        const result = await moveTaskAction({
          taskId,
          destinationStatus,
          beforeTaskId,
          afterTaskId,
        });
        if (!result.success) {
          toast.error(result.message);
          setTasks(previousTasks);
        } else {
          toast.success(result.message ?? "Board updated.");
          router.refresh();
        }
      } catch {
        setTasks(previousTasks);
        toast.error("Unable to save the board. Refresh and try again.");
      } finally {
        saving.current = false;
      }
    });
  }
  return (
    <DndContext
      id="businessflow-board-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="mb-2 flex h-5 justify-end" aria-live="polite">
        {!canDrag ? (
          <span className="text-muted-foreground text-[11px]">
            Select a project to reorder tasks
          </span>
        ) : pending ? (
          <span className="text-muted-foreground text-[11px]">
            Saving board…
          </span>
        ) : null}
      </div>
      <div className="flex h-[calc(100dvh-250px)] min-h-[520px] snap-x snap-mandatory gap-3 overflow-x-auto pb-2 xl:overflow-x-visible">
        {columns.map((column) => (
          <Column
            key={column.id}
            {...column}
            tasks={grouped[column.id]}
            disabled={!canDrag || pending}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="bg-surface-elevated border-primary/30 w-[276px] rotate-1 rounded-lg border p-3 shadow-[0_18px_50px_rgba(0,0,0,.22)]">
            <TaskCardContent task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
