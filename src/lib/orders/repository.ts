import { computeOrderTotals } from "@/lib/orders/compute-order-totals";
import { formatCurrency } from "@/lib/orders/currency";
import {
  buildOrdersPrismaWhere,
  type OrdersListFilters,
  type OrdersQueryFilters,
} from "@/lib/orders/filters";
import { buildPaginationMeta, getSkipTake } from "@/lib/pagination";
import { generateOrderNumber } from "@/lib/orders/generate-order-number";
import { orderCustomerInclude } from "@/lib/orders/order-customers";
import type {
  CreateOrderLabels,
  OrderFormatOptions,
} from "@/lib/orders/format-options";
import { mapDbOrderToUi, mapUiStatusToDb } from "@/lib/orders/order-mapper";
import type {
  CreateOrderCustomerInput,
  CreateOrderInput,
  Order,
  OrderStatus,
  OrdersListResponse,
} from "@/lib/orders/types";
import { prisma } from "@/lib/prisma";

async function getRestaurantContext(restaurantId: string) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      currency: true,
      timezone: true,
    },
  });
}

async function resolveOrderCustomers(
  restaurantId: string,
  customers: CreateOrderCustomerInput[],
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

const ORDERS_BOARD_LIMIT = 500;

export async function listOrders(
  restaurantId: string,
  filters?: OrdersListFilters,
  formatOptions?: OrderFormatOptions,
): Promise<OrdersListResponse> {
  const restaurant = await getRestaurantContext(restaurantId);

  if (!restaurant) {
    return {
      orders: [],
      restaurantId,
      updatedAt: new Date().toISOString(),
      insights: [],
      pagination: buildPaginationMeta(0, {
        page: filters?.page ?? 1,
        pageSize: filters?.pageSize ?? 20,
      }),
    };
  }

  const where = buildOrdersPrismaWhere(
    restaurantId,
    filters,
    restaurant.timezone,
  );
  const pagination = {
    page: filters?.page ?? 1,
    pageSize: filters?.pageSize ?? 20,
  };
  const { skip, take } = getSkipTake(pagination);

  const [total, dbOrders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderCustomerInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  const orders = dbOrders.map((order) =>
    mapDbOrderToUi(order, {
      currency: restaurant.currency,
      timezone: restaurant.timezone,
      locale: formatOptions?.locale,
      customerLabels: formatOptions?.customerLabels,
    }),
  );

  return {
    orders,
    restaurantId,
    updatedAt: new Date().toISOString(),
    insights: [],
    pagination: buildPaginationMeta(total, pagination),
  };
}

export async function listOrdersBoard(
  restaurantId: string,
  filters: OrdersQueryFilters | undefined,
  formatOptions?: OrderFormatOptions,
): Promise<Order[]> {
  const restaurant = await getRestaurantContext(restaurantId);

  if (!restaurant) {
    return [];
  }

  const where = buildOrdersPrismaWhere(
    restaurantId,
    filters,
    restaurant.timezone,
  );

  const dbOrders = await prisma.order.findMany({
    where,
    include: orderCustomerInclude,
    orderBy: { createdAt: "desc" },
    take: ORDERS_BOARD_LIMIT,
  });

  return dbOrders.map((order) =>
    mapDbOrderToUi(order, {
      currency: restaurant.currency,
      timezone: restaurant.timezone,
      locale: formatOptions?.locale,
      customerLabels: formatOptions?.customerLabels,
    }),
  );
}

export async function getOrder(
  restaurantId: string,
  orderId: string,
  formatOptions?: OrderFormatOptions,
): Promise<Order | null> {
  const restaurant = await getRestaurantContext(restaurantId);

  if (!restaurant) {
    return null;
  }

  const order = await prisma.order.findUnique({
    where: {
      restaurantId_orderNumber: {
        restaurantId,
        orderNumber: orderId,
      },
    },
    include: orderCustomerInclude,
  });

  if (!order) {
    return null;
  }

  return mapDbOrderToUi(order, {
    currency: restaurant.currency,
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
    customerLabels: formatOptions?.customerLabels,
  });
}

export async function updateOrderStatus(
  restaurantId: string,
  orderId: string,
  status: OrderStatus,
  formatOptions?: OrderFormatOptions,
): Promise<Order> {
  const restaurant = await getRestaurantContext(restaurantId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const order = await prisma.order.update({
    where: {
      restaurantId_orderNumber: {
        restaurantId,
        orderNumber: orderId,
      },
    },
    data: {
      status: mapUiStatusToDb(status),
    },
    include: orderCustomerInclude,
  });

  return mapDbOrderToUi(order, {
    currency: restaurant.currency,
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
    customerLabels: formatOptions?.customerLabels,
  });
}

export async function createOrder(
  restaurantId: string,
  input: CreateOrderInput,
  assignedTo: string,
  labels?: CreateOrderLabels,
  formatOptions?: OrderFormatOptions,
): Promise<Order> {
  const restaurant = await getRestaurantContext(restaurantId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const totals = computeOrderTotals(input.items);
  const orderNumber = await generateOrderNumber(restaurantId);
  const currency = restaurant.currency;
  const linkedCustomers = await resolveOrderCustomers(
    restaurantId,
    input.customers,
  );

  const items = input.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: formatCurrency(item.priceCents, currency),
    ...(item.imageUrls?.length ? { imageUrls: item.imageUrls } : {}),
    ...(item.customization ? { customization: item.customization } : {}),
  }));

  const summary = {
    subtotal: formatCurrency(totals.subtotalCents, currency),
    taxes: formatCurrency(totals.taxCents, currency),
    total: formatCurrency(totals.totalCents, currency),
  };

  const order = await prisma.order.create({
    data: {
      restaurantId,
      orderNumber,
      tableNumber: input.tableNumber?.trim() || null,
      status: "PENDING",
      channel: input.channel,
      assignedTo,
      totalCents: totals.totalCents,
      notes: input.notes?.trim() || null,
      details: {
        history: labels?.manualOrderHistory ?? "Manual order",
        items,
        summary,
        timeline: [
          {
            time: labels?.timelineNow ?? "Now",
            titleKey: "eventReceived",
          },
        ],
      },
      customers: {
        create: linkedCustomers.map((customer) => ({
          customerId: customer.id,
        })),
      },
    },
    include: orderCustomerInclude,
  });

  return mapDbOrderToUi(order, {
    currency: restaurant.currency,
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
    customerLabels: formatOptions?.customerLabels,
  });
}
