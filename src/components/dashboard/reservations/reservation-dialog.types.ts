export type ReservationSelectedCustomer = {
  key: string;
  id?: string;
  name: string;
  phone: string;
  email: string;
  documentId: string;
  address: string;
  notes: string;
  source: "existing" | "new";
};

export type ReservationNewCustomerInput = {
  name: string;
  phone: string;
  email: string;
  documentId: string;
  address: string;
  notes: string;
};

export type ReservationCustomerPayload = {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  documentId?: string;
  address?: string;
  notes?: string;
};

export type ReservationFormSubmitData = {
  customers: ReservationCustomerPayload[];
  guestCount: number;
  status: import("@/lib/reservations/types").ReservationStatus;
  scheduledAt: string;
  notes?: string;
};
