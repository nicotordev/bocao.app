import { z } from "zod";

export const reservationStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const createReservationCustomerSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  documentId: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const createReservationSchema = z.object({
  customers: z.array(createReservationCustomerSchema).min(1),
  guestCount: z.number().int().min(1).max(100),
  status: reservationStatusSchema.default("PENDING"),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional().nullable(),
});

export const updateReservationSchema = z.object({
  customers: z.array(createReservationCustomerSchema).min(1).optional(),
  guestCount: z.number().int().min(1).max(100).optional(),
  status: reservationStatusSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
});
