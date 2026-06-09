import type { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import {
  parsePaginationParams,
  type PaginationParams,
  paginationQuerySchema,
} from "@/lib/pagination";
import type { ReservationStatus } from "@/lib/reservations/types";

export type ReservationsListFilters = {
  search?: string;
  status?: ReservationStatus | "all";
  from?: string;
  to?: string;
} & PaginationParams;

const reservationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "all",
]);

export const reservationsListQuerySchema = z
  .object({
    search: z.string().optional(),
    status: reservationStatusSchema.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .merge(paginationQuerySchema);

export function parseReservationsListSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ReservationsListFilters {
  const getValue = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const parsed = reservationsListQuerySchema.safeParse({
    search: getValue("search"),
    status: getValue("status"),
    from: getValue("from"),
    to: getValue("to"),
    page: getValue("page"),
    pageSize: getValue("pageSize"),
  });

  if (!parsed.success) {
    return {
      status: "all",
      ...parsePaginationParams(searchParams),
    };
  }

  return {
    search: parsed.data.search,
    status: parsed.data.status ?? "all",
    from: parsed.data.from,
    to: parsed.data.to,
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };
}

export function buildReservationsPrismaWhere(
  restaurantId: string,
  filters?: Omit<ReservationsListFilters, keyof PaginationParams>,
): Prisma.ReservationWhereInput {
  const where: Prisma.ReservationWhereInput = { restaurantId };

  if (!filters) {
    return where;
  }

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { guestName: { contains: search, mode: "insensitive" } },
      { guestPhone: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  if (filters.from || filters.to) {
    where.scheduledAt = {};

    if (filters.from) {
      where.scheduledAt.gte = new Date(filters.from);
    }

    if (filters.to) {
      where.scheduledAt.lte = new Date(filters.to);
    }
  }

  return where;
}
