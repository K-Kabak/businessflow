import Link from "next/link";
import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-muted-foreground mb-1 text-xs font-medium">{eyebrow}</p>
        ) : null}
        <h1 className={cn("font-semibold tracking-[-0.02em]", compact ? "text-xl" : "text-2xl leading-8")}>{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed bg-card/40 p-8 text-center">
      <SearchX className="text-muted-foreground mb-4 size-8" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm text-sm">
        {description}
      </p>
      {href && action ? (
        <Button asChild className="mt-5">
          <Link href={href}>{action}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export const thClass =
  "px-4 py-3 text-left text-xs font-medium text-muted-foreground";
export const tdClass = "border-t px-4 py-3.5 text-[13px] leading-5";

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-2.5", className)}>
      {children}
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-b py-6 first:pt-0 last:border-0 last:pb-0 md:grid-cols-[180px_1fr]">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p> : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
