import type { CustomerOption } from "@/lib/customers/types";

type CustomerOptionRecord = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  documentId: string | null;
};

export function mapCustomerOption(
  record: CustomerOptionRecord,
): CustomerOption {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone ?? null,
    email: record.email ?? null,
    documentId: record.documentId ?? null,
  };
}

export function mapCustomerOptions(
  records: CustomerOptionRecord[],
): CustomerOption[] {
  return records.map(mapCustomerOption);
}
