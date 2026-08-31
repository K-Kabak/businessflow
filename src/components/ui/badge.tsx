import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  ACTIVE: "bg-emerald-500/9 text-success before:bg-success",
  COMPLETED: "bg-emerald-500/9 text-success before:bg-success",
  DONE: "bg-emerald-500/9 text-success before:bg-success",
  IN_PROGRESS: "bg-primary-soft text-primary before:bg-primary",
  REVIEW: "bg-violet-500/9 text-violet-700 before:bg-violet-500 dark:text-violet-300",
  PLANNING: "bg-blue-500/8 text-info before:bg-info",
  TODO: "bg-muted text-muted-foreground before:bg-muted-foreground/65",
  ON_HOLD: "bg-amber-500/10 text-warning before:bg-warning",
  HIGH: "bg-amber-500/10 text-warning before:bg-warning",
  URGENT: "bg-red-500/9 text-danger before:bg-danger",
  CANCELLED: "bg-red-500/9 text-danger before:bg-danger",
  INACTIVE: "bg-muted text-muted-foreground before:bg-muted-foreground/50",
  ADMIN: "bg-primary-soft text-primary",
  EMPLOYEE: "bg-muted text-muted-foreground",
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
        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] leading-none font-medium before:size-1.5 before:shrink-0 before:rounded-full before:content-['']",
        (value === "ADMIN" || value === "EMPLOYEE") && "before:hidden",
        toneMap[value] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {humanize(value)}
    </span>
  );
}
