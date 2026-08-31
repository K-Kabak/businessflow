import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  path,
  params,
}: {
  page: number;
  totalPages: number;
  path: string;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const href = (nextPage: number) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    query.set("page", String(nextPage));
    return `${path}?${query.toString()}`;
  };
  return (
    <nav
      className="text-muted-foreground flex items-center justify-between pt-4 text-xs"
      aria-label="Pagination"
    >
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <Link
            href={href(page - 1)}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
          >
            Previous
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          <Link
            href={href(page + 1)}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
          >
            Next
          </Link>
        </Button>
      </div>
    </nav>
  );
}
