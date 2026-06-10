import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  parsePaginationParams,
  type PaginationParams,
  paginationQuerySchema,
} from "@/lib/pagination";
import type {
  CustomerChannel,
  CustomerSegment,
  CustomerSortField,
} from "@/lib/customers/types";

export type CustomersListFilters = {
  search?: string;
  segment?: CustomerSegment | "all";
  channel?: CustomerChannel | "all";
  sort?: CustomerSortField;
  tab?: "customers" | "segments" | "activity";
  customerId?: string;
  savedSegmentId?: string;
} & PaginationParams;

const customerSegmentSchema = z.enum([
  "all",
  "vip",
  "frequent",
  "new",
  "inactive",
  "at_risk",
  "whatsapp",
  "high_value",
]);

const customerChannelSchema = z.enum([
  "all",
  "whatsapp",
  "web",
  "in_person",
  "delivery",
  "reservation",
]);

const customerSortSchema = z.enum([
  "last_visit",
  "total_spend",
  "order_count",
  "name",
  "created_at",
]);

const customerTabSchema = z.enum(["customers", "segments", "activity"]);

export const customersListQuerySchema = z
  .object({
    search: z.string().optional(),
    segment: customerSegmentSchema.optional(),
    channel: customerChannelSchema.optional(),
    sort: customerSortSchema.optional(),
    tab: customerTabSchema.optional(),
    customerId: z.string().optional(),
    savedSegmentId: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export function parseCustomersListSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): CustomersListFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parsed = customersListQuerySchema.safeParse({
    search: getValue("search"),
    segment: getValue("segment"),
    channel: getValue("channel"),
    sort: getValue("sort"),
    tab: getValue("tab"),
    customerId: getValue("customerId"),
    savedSegmentId: getValue("savedSegmentId"),
    page: getValue("page"),
    pageSize: getValue("pageSize"),
  });

  if (!parsed.success) {
    return {
      segment: "all",
      channel: "all",
      sort: "last_visit",
      tab: "customers",
      ...parsePaginationParams(searchParams),
    };
  }

  return {
    search: parsed.data.search,
    segment: parsed.data.segment ?? "all",
    channel: parsed.data.channel ?? "all",
    sort: parsed.data.sort ?? "last_visit",
    tab: parsed.data.tab ?? "customers",
    customerId: parsed.data.customerId,
    savedSegmentId: parsed.data.savedSegmentId,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };
}

export type CustomersListFilterPatch = Partial<
  Pick<
    CustomersListFilters,
    | "search"
    | "segment"
    | "channel"
    | "sort"
    | "tab"
    | "customerId"
    | "savedSegmentId"
  >
>;

export function areCustomersListFiltersEqual(
  left: CustomersListFilters,
  right: CustomersListFilters,
): boolean {
  return (
    (left.search ?? "") === (right.search ?? "") &&
    (left.segment ?? "all") === (right.segment ?? "all") &&
    (left.channel ?? "all") === (right.channel ?? "all") &&
    (left.sort ?? "last_visit") === (right.sort ?? "last_visit") &&
    (left.tab ?? "customers") === (right.tab ?? "customers") &&
    left.customerId === right.customerId &&
    left.savedSegmentId === right.savedSegmentId &&
    left.page === right.page &&
    left.pageSize === right.pageSize
  );
}

export function buildCustomersPrismaWhere(
  restaurantId: string,
  filters: Pick<CustomersListFilters, "search" | "savedSegmentId">,
): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = { restaurantId };
  const search = filters.search?.trim();

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filters.savedSegmentId) {
    where.savedSegmentMembers = {
      some: { segmentId: filters.savedSegmentId },
    };
  }

  return where;
}

export function buildCustomersPrismaOrderBy(
  sort: CustomersListFilters["sort"],
): Prisma.CustomerOrderByWithRelationInput[] {
  switch (sort) {
    case "created_at":
      return [{ createdAt: "desc" }];
    case "name":
    default:
      return [{ name: "asc" }];
  }
}

export function needsComputedCustomerPipeline(
  filters: CustomersListFilters,
): boolean {
  return (
    (filters.segment !== undefined && filters.segment !== "all") ||
    (filters.channel !== undefined && filters.channel !== "all") ||
    (filters.sort !== undefined &&
      filters.sort !== "name" &&
      filters.sort !== "created_at")
  );
}

export function buildTargetCustomersListFilters(
  current: CustomersListFilters,
  next: CustomersListFilterPatch,
  options?: { page?: number },
): CustomersListFilters {
  const hasFilterChange =
    (next.search !== undefined &&
      (next.search || undefined) !== (current.search || undefined)) ||
    (next.segment !== undefined &&
      next.segment !== (current.segment ?? "all")) ||
    (next.channel !== undefined &&
      next.channel !== (current.channel ?? "all")) ||
    (next.sort !== undefined && next.sort !== (current.sort ?? "last_visit")) ||
    (next.tab !== undefined && next.tab !== (current.tab ?? "customers")) ||
    ("customerId" in next && next.customerId !== current.customerId) ||
    ("savedSegmentId" in next &&
      next.savedSegmentId !== current.savedSegmentId);

  return {
    search:
      next.search !== undefined ? next.search || undefined : current.search,
    segment: next.segment ?? current.segment ?? "all",
    channel: next.channel ?? current.channel ?? "all",
    sort: next.sort ?? current.sort ?? "last_visit",
    tab: next.tab ?? current.tab ?? "customers",
    customerId: "customerId" in next ? next.customerId : current.customerId,
    savedSegmentId:
      "savedSegmentId" in next
        ? next.savedSegmentId
        : current.savedSegmentId,
    page: options?.page ?? (hasFilterChange ? 1 : current.page),
    pageSize: current.pageSize,
  };
}
