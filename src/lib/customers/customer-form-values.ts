import type { CustomerTagSummary } from "@/lib/customers/tags.types";

export type CustomerFormValues = {
  name: string;
  phone: string;
  email: string;
  documentId: string;
  address: string;
  notes: string;
  avatar: string;
  tagIds: string[];
};

export const emptyCustomerFormValues: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  documentId: "",
  address: "",
  notes: "",
  avatar: "",
  tagIds: [],
};

export function customerDetailToFormValues(input: {
  name: string;
  phone: string | null;
  email: string | null;
  documentId?: string | null;
  address?: string | null;
  notes: string | null;
  avatar: string | null;
  tags: CustomerTagSummary[];
}): CustomerFormValues {
  return {
    name: input.name,
    phone: input.phone ?? "",
    email: input.email ?? "",
    documentId: input.documentId ?? "",
    address: input.address ?? "",
    notes: input.notes ?? "",
    avatar: input.avatar ?? "",
    tagIds: input.tags.map((tag) => tag.id),
  };
}
