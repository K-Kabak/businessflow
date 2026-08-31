"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <section aria-live="polite" className="max-w-sm">
        <span className="bg-danger-soft text-danger mx-auto grid size-10 place-items-center rounded-lg">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <p className="text-muted-foreground mt-4 text-xs font-medium">
          Workspace error
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          The page could not be loaded. Please try again.
        </p>
        <Button className="mt-5" onClick={retry}>
          Try again
        </Button>
      </section>
    </div>
  );
}
