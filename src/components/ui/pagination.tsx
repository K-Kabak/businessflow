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
    <div className="text-muted-foreground flex items-center justify-between pt-4 text-sm">
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
          <Link href={href(page - 1)}>Previous</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          <Link href={href(page + 1)}>Next</Link>
        </Button>
      </div>
    </div>
  );
}
