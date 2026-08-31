export type SearchParams = Record<string, string | string[] | undefined>;

export function param(value: string | string[] | undefined, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function pageParam(value: string | string[] | undefined) {
  const page = Number(param(value, "1"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export const PAGE_SIZE = 20;
