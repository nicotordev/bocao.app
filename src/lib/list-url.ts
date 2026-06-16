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

export function getCurrentListHref() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function isSameListHref(currentHref: string, nextHref: string) {
  if (currentHref === nextHref) {
    return true;
  }

  const [currentPath, currentQuery = ""] = currentHref.split("?");
  const [nextPath, nextQuery = ""] = nextHref.split("?");

  if (currentPath !== nextPath) {
    return false;
  }

  const currentParams = new URLSearchParams(currentQuery);
  const nextParams = new URLSearchParams(nextQuery);
  currentParams.sort();
  nextParams.sort();

  return currentParams.toString() === nextParams.toString();
}

type ListRouter = {
  replace: (href: string) => void;
};

export function replaceListHrefIfChanged(router: ListRouter, href: string) {
  if (typeof window === "undefined") {
    router.replace(href);
    return;
  }

  const currentHref = getCurrentListHref();

  if (isSameListHref(currentHref, href)) {
    return;
  }

  router.replace(href);
}
