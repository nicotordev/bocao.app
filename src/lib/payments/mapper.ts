import type {
  Payment as PrismaPayment,
  PaymentMethod as DbPaymentMethod,
  PaymentProvider as DbPaymentProvider,
  PaymentStatus as DbPaymentStatus,
} from "@/generated/prisma/client";
import type {
  OrderPayment,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "@/lib/payments/types";

const METHOD_TO_DB: Record<PaymentMethod, DbPaymentMethod> = {
  cash: "CASH",
  card: "CARD",
  transfer: "TRANSFER",
  qr: "QR",
  other: "OTHER",
  manual_pending: "MANUAL_PENDING",
};

const METHOD_TO_UI: Record<DbPaymentMethod, PaymentMethod> = {
  CASH: "cash",
  CARD: "card",
  TRANSFER: "transfer",
  QR: "qr",
  OTHER: "other",
  MANUAL_PENDING: "manual_pending",
};

const PROVIDER_TO_DB: Record<PaymentProvider, DbPaymentProvider> = {
  manual: "MANUAL",
};

const PROVIDER_TO_UI: Record<DbPaymentProvider, PaymentProvider> = {
  MANUAL: "manual",
};

const STATUS_TO_DB: Record<PaymentStatus, DbPaymentStatus> = {
  pending: "PENDING",
  completed: "COMPLETED",
  failed: "FAILED",
  refunded: "REFUNDED",
};

const STATUS_TO_UI: Record<DbPaymentStatus, PaymentStatus> = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

export function mapPaymentMethodToDb(method: PaymentMethod): DbPaymentMethod {
  return METHOD_TO_DB[method];
}

export function mapPaymentMethodToUi(method: DbPaymentMethod): PaymentMethod {
  return METHOD_TO_UI[method];
}

export function mapPaymentProviderToDb(
  provider: PaymentProvider,
): DbPaymentProvider {
  return PROVIDER_TO_DB[provider];
}

export function mapPaymentProviderToUi(
  provider: DbPaymentProvider,
): PaymentProvider {
  return PROVIDER_TO_UI[provider];
}

export function mapPaymentStatusToDb(status: PaymentStatus): DbPaymentStatus {
  return STATUS_TO_DB[status];
}

export function mapPaymentStatusToUi(status: DbPaymentStatus): PaymentStatus {
  return STATUS_TO_UI[status];
}

export function mapDbPaymentToUi(payment: PrismaPayment): OrderPayment {
  return {
    id: payment.id,
    method: mapPaymentMethodToUi(payment.method),
    provider: mapPaymentProviderToUi(payment.provider),
    status: mapPaymentStatusToUi(payment.status),
    amountCents: payment.amountCents,
    currency: payment.currency,
    externalRef: payment.externalRef ?? undefined,
  };
}

export function resolvePaymentStatusForOrderIntent(
  intent: "draft" | "confirm",
  method: PaymentMethod,
): PaymentStatus {
  if (intent === "draft" || method === "manual_pending") {
    return "pending";
  }

  return "completed";
}
