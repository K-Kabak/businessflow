import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function startOfTodayUtc(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export function isOverdue(
  deadline: Date | null | undefined,
  status: string,
  now = new Date(),
) {
  return Boolean(
    deadline && deadline < startOfTodayUtc(now) && status !== "DONE",
  );
}

export function calculateProjectProgress(tasks: Array<{ status: string }>) {
  if (tasks.length === 0) return 0;
  return Math.round(
    (tasks.filter((task) => task.status === "DONE").length / tasks.length) *
      100,
  );
}

export function parseDateInput(value: string | null | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function toDateInputValue(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}
