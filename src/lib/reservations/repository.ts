import { resolveCustomers } from "@/lib/customers/resolve-customers";
import { prisma } from "@/lib/prisma";
import type {
  CreateReservationInput,
  Reservation,
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
  filters?: {
    search?: string;
    status?: string;
    from?: string;
    to?: string;
  },
): Promise<Reservation[]> {
  const where: any = {
    restaurantId,
  };

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { guestName: { contains: filters.search, mode: "insensitive" } },
      { guestPhone: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.from || filters?.to) {
    where.scheduledAt = {};
    if (filters.from) {
      where.scheduledAt.gte = new Date(filters.from);
    }
    if (filters.to) {
      where.scheduledAt.lte = new Date(filters.to);
    }
  }

  const dbReservations = await prisma.reservation.findMany({
    where,
    orderBy: {
      scheduledAt: "asc",
    },
  });

  return dbReservations.map((res) => mapReservation(res));
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
