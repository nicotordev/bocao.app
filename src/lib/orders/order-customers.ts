import type { Customer } from "@/generated/prisma/client";

type FormatOrderCustomerLabelInput = {
  customers: Pick<Customer, "name" | "phone">[];
  tableNumber?: string | null;
};

export function formatOrderCustomerLabel({
  customers,
  tableNumber,
}: FormatOrderCustomerLabelInput) {
  const customerNames = customers.map((customer) => customer.name);
  const phone =
    customers.find((customer) => customer.phone)?.phone ??
    customers[0]?.phone ??
    "";

  let customerName = customerNames.join(", ") || "Cliente";

  if (tableNumber?.trim()) {
    const namesSuffix =
      customerNames.length > 0 ? ` · ${customerNames.join(", ")}` : "";
    customerName = `Mesa ${tableNumber.trim()}${namesSuffix}`;
  }

  return {
    customerName,
    customerNames,
    phone,
  };
}

export const orderCustomerInclude = {
  customers: {
    include: { customer: true },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export function getOrderCustomers(
  order: {
    customers?: Array<{ customer: Customer }>;
  },
) {
  return order.customers?.map((link) => link.customer) ?? [];
}
