export type CustomerTagSummary = {
  id: string;
  name: string;
  color: string | null;
};

export type CustomerTagAssignmentSummary = CustomerTagSummary & {
  assignedAt: string;
  assignedAtRelative: string;
};

export type CreateCustomerTagInput = {
  name: string;
  color?: string;
};

export type BulkCustomerTagOperation = "add" | "remove";

export type BulkCustomerTagsInput = {
  customerIds: string[];
  tagIds: string[];
  operation: BulkCustomerTagOperation;
};
