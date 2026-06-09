import { resolveCustomers } from "@/lib/customers/resolve-customers";
import {
  buildReservationsPrismaWhere,
  type ReservationsListFilters,
} from "@/lib/reservations/filters";
import { buildPaginationMeta, getSkipTake } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type {
  CreateReservationInput,
  Reservation,
  ReservationsKpiValues,
  UpdateReservationInput,
} from "./types";

function mapReservation(res: {
  id: string;
  restaurantId: string;
  customerId: string | null;
  guestName: string;
  guestPhone: string | null;
  guestCount: number;
  status: Reservation["status"];
  scheduledAt: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Reservation {
  return {
    id: res.id,
    restaurantId: res.restaurantId,
    customerId: res.customerId,
    guestName: res.guestName,
    guestPhone: res.guestPhone,
    guestCount: res.guestCount,
    status: res.status,
    scheduledAt: res.scheduledAt.toISOString(),
    notes: res.notes,
    createdAt: res.createdAt.toISOString(),
    updatedAt: res.updatedAt.toISOString(),
  };
}

function buildGuestFieldsFromCustomers(
  customers: Awaited<ReturnType<typeof resolveCustomers>>,
) {
  return {
    guestName: customers.map((customer) => customer.name).join(", "),
    guestPhone: customers.find((customer) => customer.phone)?.phone ?? null,
    customerId: customers[0]?.id ?? null,
  };
}

export async function listReservations(
  restaurantId: string,
  filters?: ReservationsListFilters,
) {
  const where = buildReservationsPrismaWhere(restaurantId, {
    search: filters?.search,
    status: filters?.status,
    from: filters?.from,
    to: filters?.to,
  });
  const pagination = {
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 20,
  };
  const { skip, take } = getSkipTake(pagination);

  const [total, dbReservations] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      skip,
      take,
    }),
  ]);

  return {
    reservations: dbReservations.map((res) => mapReservation(res)),
    pagination: buildPaginationMeta(total, pagination),
  };
}

export async function getReservationsKpis(
  restaurantId: string,
): Promise<ReservationsKpiValues> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const todayReservations = await prisma.reservation.findMany({
    where: {
      restaurantId,
      scheduledAt: {
        gte: start,
        lte: end,
      },
    },
    select: {
      status: true,
      guestCount: true,
    },
  });

  const total = todayReservations.length;
  const confirmed = todayReservations.filter((reservation) =>
    ["CONFIRMED", "SEATED", "COMPLETED"].includes(reservation.status),
  ).length;
  const pending = todayReservations.filter(
    (reservation) => reservation.status === "PENDING",
  ).length;
  const guests = todayReservations
    .filter(
      (reservation) =>
        reservation.status !== "CANCELLED" && reservation.status !== "NO_SHOW",
    )
    .reduce((sum, reservation) => sum + reservation.guestCount, 0);

  return { total, confirmed, pending, guests };
}

export async function getReservation(
  restaurantId: string,
  reservationId: string,
): Promise<Reservation | null> {
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      restaurantId,
    },
  });

  if (!reservation) {
    return null;
  }

  return mapReservation(reservation);
}

export async function createReservation(
  restaurantId: string,
  input: CreateReservationInput,
): Promise<Reservation[]> {
  const resolvedCustomers = await resolveCustomers(
    restaurantId,
    input.customers,
  );

  if (resolvedCustomers.length === 0) {
    throw new Error("At least one customer is required");
  }

  const guestFields =
    resolvedCustomers.length === 1
      ? {
          customerId: resolvedCustomers[0]!.id,
          guestName: resolvedCustomers[0]!.name,
          guestPhone: resolvedCustomers[0]!.phone,
        }
      : buildGuestFieldsFromCustomers(resolvedCustomers);

  const res = await prisma.reservation.create({
    data: {
      restaurantId,
      guestCount: input.guestCount,
      status: input.status,
      scheduledAt: new Date(input.scheduledAt),
      notes: input.notes || null,
      ...guestFields,
    },
  });

  return [mapReservation(res)];
}

export async function updateReservation(
  restaurantId: string,
  reservationId: string,
  input: UpdateReservationInput,
): Promise<Reservation> {
  const existing = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      restaurantId,
    },
  });

  if (!existing) {
    throw new Error("Reservation not found");
  }

  const data: {
    guestName?: string;
    guestPhone?: string | null;
    customerId?: string | null;
    guestCount?: number;
    status?: Reservation["status"];
    scheduledAt?: Date;
    notes?: string | null;
  } = {};

  if (input.customers?.length) {
    const resolvedCustomers = await resolveCustomers(
      restaurantId,
      input.customers,
    );
    const guestFields = buildGuestFieldsFromCustomers(resolvedCustomers);
    data.guestName = guestFields.guestName;
    data.guestPhone = guestFields.guestPhone;
    data.customerId = guestFields.customerId;
  }

  if (input.guestCount !== undefined) data.guestCount = input.guestCount;
  if (input.status !== undefined) data.status = input.status;
  if (input.scheduledAt !== undefined)
    data.scheduledAt = new Date(input.scheduledAt);
  if (input.notes !== undefined) data.notes = input.notes || null;

  const res = await prisma.reservation.update({
    where: { id: reservationId },
    data,
  });

  return mapReservation(res);
}

export async function deleteReservation(
  restaurantId: string,
  reservationId: string,
): Promise<boolean> {
  const existing = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      restaurantId,
    },
  });

  if (!existing) {
    throw new Error("Reservation not found");
  }

  await prisma.reservation.delete({
    where: { id: reservationId },
  });

  return true;
}
