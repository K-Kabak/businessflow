"use client";

import type { TaskStatus } from "@/generated/prisma/client";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateTaskStatusAction } from "@/features/actions";

export function TaskStatusSelect({
  taskId,
  value,
}: {
  taskId: string;
  value: TaskStatus;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="Update task status"
      disabled={pending}
      value={value}
      onChange={(event) => {
        const next = event.target.value as TaskStatus;
        startTransition(async () => {
          const result = await updateTaskStatusAction(taskId, next);
          if (result.success) toast.success(result.message);
          else toast.error(result.message);
        });
      }}
      className="bg-card hover:border-border-strong disabled:bg-muted h-8 rounded-md border px-2 text-xs transition-colors"
    >
      <option value="TODO">To do</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="REVIEW">Review</option>
      <option value="DONE">Done</option>
    </select>
  );
}
