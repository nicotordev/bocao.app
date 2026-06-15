import { buildCustomersActivityFeed } from "@/lib/customers/compute-activity";
import { computeCustomerInsights } from "@/lib/customers/compute-insights";
import { computeCustomersKpis } from "@/lib/customers/compute-kpis";
import {
  buildCustomersPrismaOrderBy,
  buildCustomersPrismaWhere,
  needsComputedCustomerPipeline,
  type CustomersListFilters,
} from "@/lib/customers/filters";
import {
  mapCustomerOption,
  mapCustomerOptions,
} from "@/lib/customers/customer-option";
import {
  buildSegmentContext,
  mapCustomerDetail,
  mapCustomerRecord,
} from "@/lib/customers/mapper";
import { customerMatchesSegmentFilter } from "@/lib/customers/segments";
import {
  bulkUpdateCustomerTags,
  syncCustomerTagAssignments,
} from "@/lib/customers/tags.repository";
import {
  getSmartSegmentCustomerIds,
  resolveCustomerSmartSegments,
} from "@/lib/customers/smart-segments/resolve-smart-segments";
import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerListItem,
  CustomerOption,
  CustomersListResponse,
  UpdateCustomerInput,
} from "@/lib/customers/types";
import type { Prisma } from "@/generated/prisma/client";
import { fetchRestaurantSegmentContext } from "@/lib/customers/segment-context";
import { listSavedCustomerSegments } from "@/lib/customers/saved-segments.repository";
import { buildPaginationMeta, getSkipTake } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

const customerInclude = {
  orderLinks: {
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalCents: true,
          channel: true,
          type: true,
          createdAt: true,
          status: true,
          details: true,
        },
      },
    },
  },
  reservations: {
    select: {
      id: true,
      guestCount: true,
      status: true,
      scheduledAt: true,
      createdAt: true,
    },
  },
  tagAssignments: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  },
  savedSegmentMembers: {
    include: {
      segment: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.CustomerInclude;

type ListCustomersOptions = {
  currency: string;
  timezone: string;
  locale: string;
  neverLabel: string;
  notAvailableLabel: string;
};

function sortCustomers(
  customers: CustomerListItem[],
  sort: CustomersListFilters["sort"],
): CustomerListItem[] {
  const sorted = [...customers];

  switch (sort) {
    case "name":
      sorted.sort((left, right) => left.name.localeCompare(right.name));
      break;
    case "total_spend":
      sorted.sort(
        (left, right) => right.totalSpendCents - left.totalSpendCents,
      );
      break;
    case "order_count":
      sorted.sort((left, right) => right.orderCount - left.orderCount);
      break;
    case "created_at":
      sorted.sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );
      break;
    case "last_visit":
    default:
      sorted.sort((left, right) => {
        const leftTime = left.lastVisitAt
          ? new Date(left.lastVisitAt).getTime()
          : 0;
        const rightTime = right.lastVisitAt
          ? new Date(right.lastVisitAt).getTime()
          : 0;
        return rightTime - leftTime;
      });
      break;
  }

  return sorted;
}

function applyCustomerComputedFilters(
  customers: CustomerListItem[],
  filters: CustomersListFilters,
  smartSegmentCustomerIds: Set<string> | null,
): CustomerListItem[] {
  return customers.filter((customer) => {
    if (
      smartSegmentCustomerIds &&
      !smartSegmentCustomerIds.has(customer.id)
    ) {
      return false;
    }

    if (
      filters.segment &&
      !customerMatchesSegmentFilter(customer.segments, filters.segment)
    ) {
      return false;
    }

    if (filters.channel && filters.channel !== "all") {
      if (customer.primaryChannel !== filters.channel) {
        return false;
      }
    }

    return true;
  });
}

async function fetchCustomerRecords(where: Prisma.CustomerWhereInput) {
  return prisma.customer.findMany({
    where,
    include: customerInclude,
    orderBy: [{ name: "asc" }],
  });
}

async function mapAllCustomers(
  restaurantId: string,
  options: ListCustomersOptions,
): Promise<CustomerListItem[]> {
  const records = await fetchCustomerRecords({ restaurantId });
  const preliminary = records.map((record) =>
    mapCustomerRecord(
      record,
      { restaurantAverageTicketCents: 0, spendPercentile90Cents: 0 },
      options,
    ),
  );
  const context = buildSegmentContext(preliminary);

  return records.map((record) => mapCustomerRecord(record, context, options));
}

async function getRestaurantOrganizationId(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { organizationId: true },
  });

  if (!restaurant) {
    throw new Error("RESTAURANT_NOT_FOUND");
  }

  return restaurant.organizationId;
}

function buildCustomerData(input: {
  name?: string;
  phone?: string;
  email?: string;
  documentId?: string;
  address?: string;
  notes?: string;
  avatar?: string;
}) {
  return {
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.phone !== undefined ? { phone: input.phone.trim() || null } : {}),
    ...(input.email !== undefined ? { email: input.email.trim() || null } : {}),
    ...(input.documentId !== undefined
      ? { documentId: input.documentId.trim() || null }
      : {}),
    ...(input.address !== undefined
      ? { address: input.address.trim() || null }
      : {}),
    ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
    ...(input.avatar !== undefined
      ? { avatar: input.avatar.trim() || null }
      : {}),
  };
}

export async function createCustomer(
  restaurantId: string,
  input: CreateCustomerInput,
): Promise<CustomerOption> {
  const organizationId = await getRestaurantOrganizationId(restaurantId);

  const customer = await prisma.customer.create({
    data: {
      restaurantId,
      ...buildCustomerData(input),
      name: input.name.trim(),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      documentId: true,
    },
  });

  if (input.tagIds && input.tagIds.length > 0) {
    await syncCustomerTagAssignments(customer.id, organizationId, input.tagIds);
  }

  return mapCustomerOption(customer);
}

export async function updateCustomer(
  restaurantId: string,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<CustomerOption> {
  const organizationId = await getRestaurantOrganizationId(restaurantId);
  const existing = await prisma.customer.findFirst({
    where: {
      id: customerId,
      restaurantId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("CUSTOMER_NOT_FOUND");
  }

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: buildCustomerData(input),
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      documentId: true,
    },
  });

  if (input.tagIds !== undefined) {
    await syncCustomerTagAssignments(customerId, organizationId, input.tagIds);
  }

  return mapCustomerOption(customer);
}

export async function bulkAssignCustomerTags(
  restaurantId: string,
  input: Parameters<typeof bulkUpdateCustomerTags>[2],
) {
  const organizationId = await getRestaurantOrganizationId(restaurantId);
  return bulkUpdateCustomerTags(restaurantId, organizationId, input);
}

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

  return mapCustomerOptions(customers);
}

export async function getCustomer(
  restaurantId: string,
  customerId: string,
): Promise<CustomerOption | null> {
  const customer = await prisma.customer.findFirst({
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

  return customer ? mapCustomerOption(customer) : null;
}

export async function deleteCustomers(
  restaurantId: string,
  customerIds: string[],
): Promise<number> {
  const uniqueIds = [...new Set(customerIds)];

  if (uniqueIds.length === 0) {
    return 0;
  }

  const result = await prisma.customer.deleteMany({
    where: {
      restaurantId,
      id: { in: uniqueIds },
    },
  });

  return result.count;
}

export async function listCustomersPage(
  restaurantId: string,
  filters: CustomersListFilters,
  options: ListCustomersOptions,
): Promise<CustomersListResponse> {
  const prismaWhere = buildCustomersPrismaWhere(restaurantId, filters);
  const allCustomers = await mapAllCustomers(restaurantId, options);
  const [savedSegments, smartSegmentsResolved] = await Promise.all([
    listSavedCustomerSegments(restaurantId),
    resolveCustomerSmartSegments({
      restaurantId,
      locale: options.locale,
      customers: allCustomers,
      neverLabel: options.neverLabel,
      currency: options.currency,
    }),
  ]);
  const segmentContext = buildSegmentContext(allCustomers);
  const smartSegmentCustomerIds = getSmartSegmentCustomerIds(
    smartSegmentsResolved.customerIdsBySegmentId,
    filters.smartSegmentId,
  );

  let customers: CustomerListItem[];
  let pagination: ReturnType<typeof buildPaginationMeta>;

  if (needsComputedCustomerPipeline(filters)) {
    const records = await fetchCustomerRecords(prismaWhere);
    const mapped = records.map((record) =>
      mapCustomerRecord(record, segmentContext, options),
    );
    const filtered = applyCustomerComputedFilters(
      mapped,
      filters,
      smartSegmentCustomerIds,
    );
    const sorted = sortCustomers(filtered, filters.sort);
    pagination = buildPaginationMeta(sorted.length, filters);
    const start = (pagination.page - 1) * pagination.pageSize;
    customers = sorted.slice(start, start + pagination.pageSize);
  } else {
    const total = await prisma.customer.count({ where: prismaWhere });
    pagination = buildPaginationMeta(total, filters);
    const { skip, take } = getSkipTake(pagination);
    const records = await prisma.customer.findMany({
      where: prismaWhere,
      include: customerInclude,
      orderBy: buildCustomersPrismaOrderBy(filters.sort),
      skip,
      take,
    });
    customers = records.map((record) =>
      mapCustomerRecord(record, segmentContext, options),
    );
  }

  const segments = smartSegmentsResolved.segments;
  const smartSegmentsMeta = smartSegmentsResolved.meta;
  const activity = buildCustomersActivityFeed({
    customers: allCustomers,
    limit: 40,
  });
  const insights = computeCustomerInsights(allCustomers);
  const kpis = computeCustomersKpis({
    customers: allCustomers,
    currency: options.currency,
    notAvailableLabel: options.notAvailableLabel,
  });

  return {
    customers,
    pagination,
    segments,
    smartSegmentsMeta,
    savedSegments,
    activity,
    insights,
    kpis,
  };
}

export async function getCustomerDetail(
  restaurantId: string,
  customerId: string,
  options: ListCustomersOptions,
): Promise<CustomerDetail | null> {
  const [record, segmentContext] = await Promise.all([
    prisma.customer.findFirst({
      where: {
        id: customerId,
        restaurantId,
      },
      include: customerInclude,
    }),
    fetchRestaurantSegmentContext(restaurantId),
  ]);

  if (!record) {
    return null;
  }

  const detail = mapCustomerDetail(record, segmentContext, options);
  const activity = buildCustomersActivityFeed({
    customers: [detail],
    detailsById: new Map([[customerId, detail]]),
    limit: 20,
  });

  return {
    ...detail,
    activity,
  };
}
