import type {
  BulkCustomerTagsInput,
  CreateCustomerTagInput,
  CustomerTagSummary,
} from "@/lib/customers/tags.types";
import { apiRequest } from "@/lib/query/api-client";

export async function fetchCustomerTags(
  organizationId: string,
): Promise<CustomerTagSummary[]> {
  const response = await apiRequest<{ tags: CustomerTagSummary[] }>(
    `/api/organizations/${organizationId}/customer-tags`,
  );

  return response.tags;
}

export async function postCustomerTag(
  organizationId: string,
  input: CreateCustomerTagInput,
): Promise<CustomerTagSummary> {
  const response = await apiRequest<{ tag: CustomerTagSummary }>(
    `/api/organizations/${organizationId}/customer-tags`,
    {
      method: "POST",
      body: input,
    },
  );

  return response.tag;
}

export async function postBulkCustomerTags(
  restaurantId: string,
  input: BulkCustomerTagsInput,
): Promise<number> {
  const response = await apiRequest<{ affectedCount: number }>(
    `/api/restaurants/${restaurantId}/customers/tags`,
    {
      method: "POST",
      body: input,
    },
  );

  return response.affectedCount;
}
