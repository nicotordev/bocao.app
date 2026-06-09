import type { Customer } from "@/generated/prisma/client";

export type OrderCustomerLabels = {
  fallbackCustomer: string;
  tableOnly: string;
  tableWithCustomers: string;
};

type FormatOrderCustomerLabelInput = {
  customers: Pick<Customer, "name" | "phone">[];
  tableNumber?: string | null;
  labels?: OrderCustomerLabels;
};

export function formatOrderCustomerLabel({
  customers,
  tableNumber,
  labels,
}: FormatOrderCustomerLabelInput) {
  const customerNames = customers.map((customer) => customer.name);
  const phone =
    customers.find((customer) => customer.phone)?.phone ??
    customers[0]?.phone ??
    "";

  const fallbackCustomer = labels?.fallbackCustomer ?? "Customer";
  const joinedNames = customerNames.join(", ");
  let customerName = joinedNames || fallbackCustomer;

  if (tableNumber?.trim()) {
    const tableNumberValue = tableNumber.trim();
    customerName =
      customerNames.length > 0
        ? (labels?.tableWithCustomers ?? "Table {number} · {names}")
            .replace("{number}", tableNumberValue)
            .replace("{names}", joinedNames)
        : (labels?.tableOnly ?? "Table {number}").replace(
            "{number}",
            tableNumberValue,
          );
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

export function getOrderCustomers(order: {
  customers?: Array<{ customer: Customer }>;
}) {
  return order.customers?.map((link) => link.customer) ?? [];
}
