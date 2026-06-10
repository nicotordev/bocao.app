import type {
  CreateSavedSegmentInput,
  CustomerSavedSegmentSummary,
} from "@/lib/customers/saved-segments.types";
import { apiRequest } from "@/lib/query/api-client";

export async function createSavedCustomerSegment(
  restaurantId: string,
  input: CreateSavedSegmentInput,
): Promise<CustomerSavedSegmentSummary> {
  const response = await apiRequest<{ segment: CustomerSavedSegmentSummary }>(
    `/api/restaurants/${restaurantId}/customer-segments`,
    {
      method: "POST",
      body: input,
    },
  );

  return response.segment;
}

export async function addSavedCustomerSegmentMembers(
  restaurantId: string,
  segmentId: string,
  customerIds: string[],
): Promise<CustomerSavedSegmentSummary> {
  const response = await apiRequest<{ segment: CustomerSavedSegmentSummary }>(
    `/api/restaurants/${restaurantId}/customer-segments/${encodeURIComponent(
      segmentId,
    )}/members`,
    {
      method: "POST",
      body: { customerIds },
    },
  );

  return response.segment;
}
