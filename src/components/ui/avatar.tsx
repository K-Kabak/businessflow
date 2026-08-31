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
      className={`${size === "sm" ? "size-7 text-[10px]" : "size-9 text-xs"} inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-500/15 font-semibold text-indigo-700 dark:text-indigo-300`}
    >
      {initials(name)}
    </span>
  );
}
