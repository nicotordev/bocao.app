import type { CustomerOption } from "@/lib/customers/types";
import { prisma } from "@/lib/prisma";

export async function listCustomers(
  restaurantId: string,
): Promise<CustomerOption[]> {
  const customers = await prisma.customer.findMany({
    where: { restaurantId },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      documentId: true,
    },
    orderBy: [{ name: "asc" }],
  });

  return customers;
}

export async function getCustomer(
  restaurantId: string,
  customerId: string,
): Promise<CustomerOption | null> {
  return prisma.customer.findFirst({
    where: {
      id: customerId,
      restaurantId,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      documentId: true,
    },
  });
}
