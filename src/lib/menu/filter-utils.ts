import { z } from "zod";
import {
  parsePaginationParams,
  type PaginationParams,
  paginationQuerySchema,
} from "@/lib/pagination";

export type MenuListFilters = {
  search?: string;
  categoryId?: string;
  showUnavailable?: boolean;
} & PaginationParams;

export const menuListQuerySchema = z
  .object({
    search: z.string().optional(),
    category: z.string().optional(),
    showUnavailable: z.enum(["true", "false"]).optional(),
  })
  .merge(paginationQuerySchema);

export function parseMenuListSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): MenuListFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parsed = menuListQuerySchema.safeParse({
    search: getValue("search"),
    category: getValue("category"),
    showUnavailable: getValue("showUnavailable"),
    page: getValue("page"),
    pageSize: getValue("pageSize"),
  });

  if (!parsed.success) {
    return {
      showUnavailable: true,
      ...parsePaginationParams(searchParams),
    };
  }

  return {
    search: parsed.data.search,
    categoryId:
      parsed.data.category && parsed.data.category !== "all"
        ? parsed.data.category
        : undefined,
    showUnavailable: parsed.data.showUnavailable !== "false",
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };
}

export function hasMenuContentFilters(
  filters: Pick<MenuListFilters, "search" | "categoryId" | "showUnavailable">,
) {
  return Boolean(
    filters.search?.trim() ||
      filters.categoryId ||
      filters.showUnavailable === false,
  );
}

export function hasActiveMenuFilters(filters: MenuListFilters) {
  return hasMenuContentFilters(filters) || filters.page > 1;
}
