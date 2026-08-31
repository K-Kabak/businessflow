import { initials } from "@/lib/format";

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-label={name}
      className={`${size === "sm" ? "size-7 text-[10px]" : "size-9 text-xs"} bg-primary-soft text-primary inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-primary/10`}
    >
      {initials(name)}
    </span>
  );
}
