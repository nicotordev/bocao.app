import "server-only";

import { assertSourceRestaurantsAccessible } from "@/lib/customers/import-customers.access";
import type {
  ImportCustomersResult,
  NormalizedCustomerImportRow,
} from "@/lib/customers/import-customers.types";
import { prisma } from "@/lib/prisma";

type CustomerToImport = {
  name: string;
  email: string | null;
  phone: string | null;
  documentId: string | null;
  address: string | null;
  notes: string | null;
  avatar: string | null;
};

async function importCustomersIntoRestaurant(
  targetRestaurantId: string,
  customers: CustomerToImport[],
): Promise<number> {
  if (customers.length === 0) {
    return 0;
  }

  await prisma.customer.createMany({
    data: customers.map((customer) => ({
      restaurantId: targetRestaurantId,
      name: customer.name.trim(),
      email: customer.email,
      phone: customer.phone,
      documentId: customer.documentId,
      address: customer.address,
      notes: customer.notes,
      avatar: customer.avatar,
    })),
  });

  return customers.length;
}

export async function importCustomersFromRestaurants(input: {
  targetRestaurantId: string;
  userId: string;
  customerIds: string[];
}): Promise<ImportCustomersResult> {
  const { targetRestaurantId, userId, customerIds } = input;

  if (customerIds.length === 0) {
    return { ok: false, error: "NO_CUSTOMERS_SELECTED" };
  }

  const sourceCustomers = await prisma.customer.findMany({
    where: {
      id: { in: customerIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      documentId: true,
      address: true,
      notes: true,
      avatar: true,
      restaurantId: true,
    },
  });

  if (sourceCustomers.length === 0) {
    return { ok: false, error: "NO_CUSTOMERS_SELECTED" };
  }

  const sourceRestaurantIds = Array.from(
    new Set(sourceCustomers.map((customer) => customer.restaurantId)),
  );

  const accessible = await assertSourceRestaurantsAccessible(
    userId,
    sourceRestaurantIds,
  );

  if (!accessible) {
    return { ok: false, error: "FORBIDDEN" };
  }

  const customersToImport: CustomerToImport[] = sourceCustomers
    .filter((customer) => customer.restaurantId !== targetRestaurantId)
    .map((customer) => ({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      documentId: customer.documentId,
      address: customer.address,
      notes: customer.notes,
      avatar: customer.avatar,
    }));

  if (customersToImport.length === 0) {
    return { ok: false, error: "NO_CUSTOMERS_SELECTED" };
  }

  try {
    const importedCustomers = await importCustomersIntoRestaurant(
      targetRestaurantId,
      customersToImport,
    );

    return { ok: true, importedCustomers };
  } catch {
    return { ok: false, error: "IMPORT_FAILED" };
  }
}

export async function importCustomersFromFileRows(input: {
  targetRestaurantId: string;
  rows: NormalizedCustomerImportRow[];
}): Promise<ImportCustomersResult> {
  const customersToImport: CustomerToImport[] = input.rows.map((row) => ({
    name: row.name,
    email: row.email,
    phone: row.phone,
    documentId: row.documentId,
    address: row.address,
    notes: row.notes,
    avatar: row.avatar,
  }));

  if (customersToImport.length === 0) {
    return { ok: false, error: "NO_CUSTOMERS_SELECTED" };
  }

  try {
    const importedCustomers = await importCustomersIntoRestaurant(
      input.targetRestaurantId,
      customersToImport,
    );

    return { ok: true, importedCustomers };
  } catch {
    return { ok: false, error: "IMPORT_FAILED" };
  }
}
