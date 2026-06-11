export type PaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "qr"
  | "other"
  | "manual_pending";

export type PaymentProvider = "manual";

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type OrderPayment = {
  id: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  externalRef?: string;
};
