import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  ACTIVE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  COMPLETED: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  DONE: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  IN_PROGRESS: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  REVIEW: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  PLANNING: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  TODO: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
  ON_HOLD: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  HIGH: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
  URGENT: "bg-red-500/12 text-red-700 dark:text-red-300",
  CANCELLED: "bg-red-500/12 text-red-700 dark:text-red-300",
  INACTIVE: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300",
  ADMIN: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  EMPLOYEE: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
};

export function Badge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        toneMap[value] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {humanize(value)}
    </span>
  );
}
