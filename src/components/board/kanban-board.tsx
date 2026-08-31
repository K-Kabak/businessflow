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
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { moveTaskAction } from "@/features/actions";
import { formatDate } from "@/lib/format";
import { cn, isOverdue } from "@/lib/utils";

export type BoardTask = {
  id: string;
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
        <button
          type="button"
          {...dragHandle}
          aria-label={`Move ${task.title}`}
          className="text-muted-foreground mt-0.5 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5 font-medium">{task.title}</p>
          <p className="text-muted-foreground mt-1 truncate text-xs">
            {task.project.name}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
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
            "text-muted-foreground mt-3 flex items-center gap-1.5 text-xs",
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

function SortableTaskCard({ task }: { task: BoardTask }) {
  const sortable = useSortable({ id: task.id, data: { status: task.status } });
  return (
    <article
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      {...sortable.attributes}
      className={cn(
        "bg-card rounded-xl border p-3 shadow-sm",
        sortable.isDragging && "opacity-30",
      )}
    >
      <TaskCardContent task={task} dragHandle={sortable.listeners} />
    </article>
  );
}

function Column({
  id,
  label,
  tasks,
}: {
  id: TaskStatus;
  label: string;
  tasks: BoardTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { status: id } });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "bg-muted/65 w-[300px] shrink-0 rounded-xl p-3",
        isOver && "ring-primary/50 ring-2",
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="bg-card text-muted-foreground rounded-full px-2 py-0.5 text-xs">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={rectSortingStrategy}
      >
        <div className="min-h-24 space-y-3">
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </section>
  );
}

export function KanbanBoard({ initialTasks }: { initialTasks: BoardTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
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
            .sort((a, b) => a.position - b.position),
        ]),
      ) as Record<TaskStatus, BoardTask[]>,
    [tasks],
  );
  const activeTask = tasks.find((task) => task.id === activeId);
  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }
  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over) return;
    const taskId = String(event.active.id);
    const overId = String(event.over.id);
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;
    const overTask = tasks.find((task) => task.id === overId);
    const destinationStatus = (overTask?.status ??
      (columns.some((column) => column.id === overId)
        ? overId
        : current.status)) as TaskStatus;
    const destination = grouped[destinationStatus].filter(
      (task) => task.id !== taskId,
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
    startTransition(async () => {
      const result = await moveTaskAction({
        taskId,
        destinationStatus,
        beforeTaskId,
        afterTaskId,
      });
      if (!result.success) {
        toast.error(result.message);
        setTasks(initialTasks);
      } else toast.success(result.message ?? "Board updated.");
    });
  }
  return (
    <DndContext
      id="businessflow-board-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <Column key={column.id} {...column} tasks={grouped[column.id]} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="bg-card w-[276px] rotate-2 rounded-xl border p-3 shadow-xl">
            <TaskCardContent task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
