import { prisma } from "@/lib/prisma";

export type ResolveCustomerInput = {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
  documentId?: string;
  address?: string;
  notes?: string;
};

export async function resolveCustomers(
  restaurantId: string,
  customers: ResolveCustomerInput[],
) {
  const resolved = [];

  for (const customerInput of customers) {
    if (customerInput.id) {
      const existing = await prisma.customer.findFirst({
        where: {
          id: customerInput.id,
          restaurantId,
        },
      });

      if (!existing) {
        throw new Error("Customer not found");
      }

      const updateData: {
        phone?: string | null;
        email?: string | null;
        documentId?: string | null;
        address?: string | null;
        notes?: string | null;
      } = {};

      const nextPhone = customerInput.phone?.trim();
      if (nextPhone && nextPhone !== existing.phone) {
        updateData.phone = nextPhone;
      }

      const nextEmail = customerInput.email?.trim();
      if (nextEmail && nextEmail !== existing.email) {
        updateData.email = nextEmail;
      }

      const nextDocumentId = customerInput.documentId?.trim();
      if (nextDocumentId && nextDocumentId !== existing.documentId) {
        updateData.documentId = nextDocumentId;
      }

      const nextAddress = customerInput.address?.trim();
      if (nextAddress && nextAddress !== existing.address) {
        updateData.address = nextAddress;
      }

      const nextNotes = customerInput.notes?.trim();
      if (nextNotes && nextNotes !== existing.notes) {
        updateData.notes = nextNotes;
      }

      if (Object.keys(updateData).length > 0) {
        resolved.push(
          await prisma.customer.update({
            where: { id: existing.id },
            data: updateData,
          }),
        );
      } else {
        resolved.push(existing);
      }

      continue;
    }

    resolved.push(
      await prisma.customer.create({
        data: {
          restaurantId,
          name: customerInput.name.trim(),
          phone: customerInput.phone?.trim() || null,
          email: customerInput.email?.trim() || null,
          documentId: customerInput.documentId?.trim() || null,
          address: customerInput.address?.trim() || null,
          notes: customerInput.notes?.trim() || null,
        },
      }),
    );
  }

  return resolved;
}
