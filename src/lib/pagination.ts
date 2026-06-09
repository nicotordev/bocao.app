import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginationMeta = PaginationParams & {
  total: number;
  totalPages: number;
};

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

export function parsePaginationParams(
  searchParams: Record<string, string | string[] | undefined>,
): PaginationParams {
  const parsed = paginationQuerySchema.safeParse({
    page: getParam(searchParams.page),
    pageSize: getParam(searchParams.pageSize),
  });

  return parsed.success
    ? parsed.data
    : { page: 1, pageSize: DEFAULT_PAGE_SIZE };
}

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function getSkipTake({ page, pageSize }: PaginationParams) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(
  total: number,
  { page, pageSize }: PaginationParams,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function appendPaginationParams(
  params: URLSearchParams,
  pagination: Partial<PaginationParams>,
) {
  if (pagination.page && pagination.page > 1) {
    params.set("page", String(pagination.page));
  }

  if (pagination.pageSize && pagination.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(pagination.pageSize));
  }
}
