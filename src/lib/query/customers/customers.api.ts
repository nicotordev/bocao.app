import type { CustomersListFilters } from "@/lib/customers/filters";
import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerOption,
  CustomersPageData,
  UpdateCustomerInput,
} from "@/lib/customers/types";
import { apiRequest } from "@/lib/query/api-client";

function buildCustomersSearchParams(filters?: CustomersListFilters) {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.set("search", filters.search);
  }

  if (filters?.segment && filters.segment !== "all") {
    params.set("segment", filters.segment);
  }

  if (filters?.channel && filters.channel !== "all") {
    params.set("channel", filters.channel);
  }

  if (filters?.sort && filters.sort !== "last_visit") {
    params.set("sort", filters.sort);
  }

  if (filters?.savedSegmentId) {
    params.set("savedSegmentId", filters.savedSegmentId);
  }

  if (filters?.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters?.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function fetchCustomersPage(
  restaurantId: string,
  filters?: CustomersListFilters,
): Promise<CustomersPageData> {
  return apiRequest<CustomersPageData>(
    `/api/restaurants/${restaurantId}/customers${buildCustomersSearchParams(
      filters,
    )}`,
  );
}

export async function fetchCustomerOptions(
  restaurantId: string,
): Promise<CustomerOption[]> {
  const response = await apiRequest<{ customers: CustomerOption[] }>(
    `/api/restaurants/${restaurantId}/customers/options`,
  );

  return response.customers;
}

export async function fetchCustomerDetail(
  restaurantId: string,
  customerId: string,
): Promise<CustomerDetail> {
  const response = await apiRequest<{ customer: CustomerDetail }>(
    `/api/restaurants/${restaurantId}/customers/${encodeURIComponent(
      customerId,
    )}`,
  );

  return response.customer;
}

export async function postCustomer(
  restaurantId: string,
  input: CreateCustomerInput,
): Promise<CustomerOption> {
  const response = await apiRequest<{ customer: CustomerOption }>(
    `/api/restaurants/${restaurantId}/customers`,
    {
      method: "POST",
      body: input,
    },
  );

  return response.customer;
}

export async function deleteCustomer(
  restaurantId: string,
  customerId: string,
): Promise<number> {
  const response = await apiRequest<{ deletedCount: number }>(
    `/api/restaurants/${restaurantId}/customers/${encodeURIComponent(
      customerId,
    )}`,
    { method: "DELETE" },
  );

  return response.deletedCount;
}

export async function patchCustomer(
  restaurantId: string,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<CustomerOption> {
  const response = await apiRequest<{ customer: CustomerOption }>(
    `/api/restaurants/${restaurantId}/customers/${encodeURIComponent(
      customerId,
    )}`,
    {
      method: "PATCH",
      body: input,
    },
  );

  return response.customer;
}

export async function deleteCustomers(
  restaurantId: string,
  customerIds: string[],
): Promise<number> {
  const response = await apiRequest<{ deletedCount: number }>(
    `/api/restaurants/${restaurantId}/customers/delete`,
    {
      method: "POST",
      body: { customerIds },
    },
  );

  return response.deletedCount;
}
