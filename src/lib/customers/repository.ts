import { buildCustomersActivityFeed } from "@/lib/customers/compute-activity";
import { computeCustomerInsights } from "@/lib/customers/compute-insights";
import { computeCustomersKpis } from "@/lib/customers/compute-kpis";
import type { CustomersListFilters } from "@/lib/customers/filters";
import { formatMoney, formatRelativeDate } from "@/lib/customers/format";
import {
  buildSegmentContext,
  mapCustomerDetail,
  mapCustomerRecord,
} from "@/lib/customers/mapper";
import {
  customerMatchesSegmentFilter,
  isReservationFrequentCustomer,
} from "@/lib/customers/segments";
import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerListItem,
  CustomerOption,
  CustomerSegmentCard,
  CustomersListResponse,
} from "@/lib/customers/types";
import { buildPaginationMeta } from "@/lib/pagination";
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
} as const;

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
      sorted.sort((left, right) => right.totalSpendCents - left.totalSpendCents);
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

function filterCustomers(
  customers: CustomerListItem[],
  filters: CustomersListFilters,
): CustomerListItem[] {
  const search = filters.search?.trim().toLowerCase();

  return customers.filter((customer) => {
    if (search) {
      const haystack = [
        customer.name,
        customer.phone ?? "",
        customer.email ?? "",
        ...customer.tags,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
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

function buildSegmentCards(
  customers: CustomerListItem[],
  locale: string,
  neverLabel: string,
  currency: string,
): CustomerSegmentCard[] {
  const segmentDefinitions: Array<{
    id: CustomerSegmentCard["id"];
    nameKey: string;
    descriptionKey: string;
    matches: (customer: CustomerListItem) => boolean;
  }> = [
    {
      id: "vip",
      nameKey: "segments.cards.vip.name",
      descriptionKey: "segments.cards.vip.description",
      matches: (customer) => customer.segments.includes("vip"),
    },
    {
      id: "frequent",
      nameKey: "segments.cards.frequent.name",
      descriptionKey: "segments.cards.frequent.description",
      matches: (customer) => customer.segments.includes("frequent"),
    },
    {
      id: "new",
      nameKey: "segments.cards.new.name",
      descriptionKey: "segments.cards.new.description",
      matches: (customer) => customer.segments.includes("new"),
    },
    {
      id: "inactive",
      nameKey: "segments.cards.inactive.name",
      descriptionKey: "segments.cards.inactive.description",
      matches: (customer) => customer.segments.includes("inactive"),
    },
    {
      id: "at_risk",
      nameKey: "segments.cards.atRisk.name",
      descriptionKey: "segments.cards.atRisk.description",
      matches: (customer) => customer.segments.includes("at_risk"),
    },
    {
      id: "whatsapp",
      nameKey: "segments.cards.whatsapp.name",
      descriptionKey: "segments.cards.whatsapp.description",
      matches: (customer) => customer.segments.includes("whatsapp"),
    },
    {
      id: "high_value",
      nameKey: "segments.cards.highValue.name",
      descriptionKey: "segments.cards.highValue.description",
      matches: (customer) => customer.segments.includes("high_value"),
    },
    {
      id: "reservation_frequent",
      nameKey: "segments.cards.reservationFrequent.name",
      descriptionKey: "segments.cards.reservationFrequent.description",
      matches: (customer) =>
        isReservationFrequentCustomer(customer.reservationCount),
    },
  ];

  return segmentDefinitions.map((definition) => {
    const matched = customers.filter(definition.matches);
    const averageTicketCents =
      matched.length > 0
        ? Math.round(
            matched.reduce(
              (sum, customer) => sum + customer.averageTicketCents,
              0,
            ) / matched.length,
          )
        : 0;
    const lastActivity = matched
      .map((customer) => customer.lastVisitAt)
      .filter((value): value is string => Boolean(value))
      .sort(
        (left, right) =>
          new Date(right).getTime() - new Date(left).getTime(),
      )[0];

    return {
      id: definition.id,
      nameKey: definition.nameKey,
      descriptionKey: definition.descriptionKey,
      customerCount: matched.length,
      averageTicket: formatMoney(averageTicketCents, currency),
      lastActivityRelative: formatRelativeDate(
        lastActivity ? new Date(lastActivity) : null,
        locale,
        neverLabel,
      ),
    };
  });
}

async function fetchCustomerRecords(restaurantId: string) {
  return prisma.customer.findMany({
    where: { restaurantId },
    include: customerInclude,
    orderBy: [{ name: "asc" }],
  });
}

async function mapAllCustomers(
  restaurantId: string,
  options: ListCustomersOptions,
): Promise<CustomerListItem[]> {
  const records = await fetchCustomerRecords(restaurantId);
  const preliminary = records.map((record) =>
    mapCustomerRecord(record, { restaurantAverageTicketCents: 0, spendPercentile90Cents: 0 }, options),
  );
  const context = buildSegmentContext(preliminary);

  return records.map((record) => mapCustomerRecord(record, context, options));
}

export async function createCustomer(
  restaurantId: string,
  input: CreateCustomerInput,
): Promise<CustomerOption> {
  return prisma.customer.create({
    data: {
      restaurantId,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      documentId: input.documentId?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
      avatar: input.avatar?.trim() || null,
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

export async function listCustomersPage(
  restaurantId: string,
  filters: CustomersListFilters,
  options: ListCustomersOptions,
): Promise<CustomersListResponse> {
  const allCustomers = await mapAllCustomers(restaurantId, options);
  const filtered = filterCustomers(allCustomers, filters);
  const sorted = sortCustomers(filtered, filters.sort);
  const pagination = buildPaginationMeta(sorted.length, filters);
  const start = (pagination.page - 1) * pagination.pageSize;
  const customers = sorted.slice(start, start + pagination.pageSize);
  const segments = buildSegmentCards(
    allCustomers,
    options.locale,
    options.neverLabel,
    options.currency,
  );
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
  const records = await fetchCustomerRecords(restaurantId);
  const preliminary = records.map((record) =>
    mapCustomerRecord(record, { restaurantAverageTicketCents: 0, spendPercentile90Cents: 0 }, options),
  );
  const context = buildSegmentContext(preliminary);
  const record = records.find((entry) => entry.id === customerId);

  if (!record) {
    return null;
  }

  const detail = mapCustomerDetail(record, context, options);
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
