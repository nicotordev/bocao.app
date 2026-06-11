import { orderCustomerInclude } from "@/lib/orders/order-customers";

export const orderWithPaymentsInclude = {
  ...orderCustomerInclude,
  payments: {
    orderBy: { createdAt: "asc" as const },
    take: 1,
  },
};
