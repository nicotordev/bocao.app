import {
  appendPaginationParams,
  type PaginationParams,
} from "@/lib/pagination";

export function buildListUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>,
  pagination?: Partial<PaginationParams>,
) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (typeof value === "boolean") {
      search.set(key, value ? "true" : "false");
      continue;
    }

    search.set(key, String(value));
  }

  if (pagination) {
    appendPaginationParams(search, pagination);
  }

  const query = search.toString();
  return query.length > 0 ? `${path}?${query}` : path;
}

export function searchParamsToRecord(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  if (searchParams instanceof URLSearchParams) {
    return Object.fromEntries(searchParams.entries());
  }

  return searchParams;
}
