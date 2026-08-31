import { format } from "date-fns";

export function formatDate(
  value: Date | string | null | undefined,
  fallback = "—",
) {
  return value ? format(new Date(value), "MMM d, yyyy") : fallback;
}

export function formatMoney(
  value: number | string | { toString(): string } | null | undefined,
) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
