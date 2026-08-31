import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="bg-background grid min-h-screen place-items-center p-6 text-center">
      <section className="max-w-md">
        <span className="bg-muted text-muted-foreground mx-auto grid size-11 place-items-center rounded-lg border">
          <FileQuestion className="size-5" aria-hidden="true" />
        </span>
        <p className="text-muted-foreground mt-5 text-xs font-medium">
          Error 404
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">
          Page not found
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          This resource may not exist or you may not have access.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </section>
    </main>
  );
}
