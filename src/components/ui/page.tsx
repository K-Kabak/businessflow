import Link from "next/link";
import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {action}
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
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
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
    <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export const thClass =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
export const tdClass = "border-t px-4 py-3 text-sm";
