export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type Reservation = {
  id: string;
  restaurantId: string;
  customerId: string | null;
  guestName: string;
  guestPhone: string | null;
  guestCount: number;
  status: ReservationStatus;
  scheduledAt: string; // ISO String
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReservationsListResponse = {
  reservations: Reservation[];
  restaurantId: string;
  updatedAt: string;
};

export type ReservationCustomerInput = {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  documentId?: string;
  address?: string;
  notes?: string;
};

export type CreateReservationInput = {
  customers: ReservationCustomerInput[];
  guestCount: number;
  status: ReservationStatus;
  scheduledAt: string; // ISO string
  notes?: string | null;
};

export type UpdateReservationInput = {
  customers?: ReservationCustomerInput[];
  guestCount?: number;
  status?: ReservationStatus;
  scheduledAt?: string; // ISO string
  notes?: string | null;
};
