import {
  buildOrderDetailsPayload,
  parseStoredOrderLineItems,
} from "@/lib/orders/build-order-details";
import { computeOrderTotals } from "@/lib/orders/compute-order-totals";
import {
  buildOrdersPrismaWhere,
  type OrdersListFilters,
  type OrdersQueryFilters,
} from "@/lib/orders/filters";
import { buildPaginationMeta, getSkipTake } from "@/lib/pagination";
import { generateOrderNumber } from "@/lib/orders/generate-order-number";
import {
  buildOrderCreatedEvents,
  buildOrderStatusChangeEvents,
  buildOrderUpdatedEvent,
  buildPaymentCreatedEvent,
  buildPaymentUpdatedEvent,
} from "@/lib/orders/order-events";
import { resolveOrderKind } from "@/lib/orders/order-kind";
import { orderWithPaymentsInclude } from "@/lib/orders/order-includes";
import type {
  CreateOrderLabels,
  OrderFormatOptions,
} from "@/lib/orders/format-options";
import { mapDbOrderToUi, mapUiStatusToDb } from "@/lib/orders/order-mapper";
import {
  mapPaymentMethodToDb,
  mapPaymentProviderToDb,
  mapPaymentStatusToDb,
  resolvePaymentStatusForOrderIntent,
} from "@/lib/payments/mapper";
import type {
  CreateOrderCustomerInput,
  CreateOrderInput,
  Order,
  OrderStatus,
  OrdersListResponse,
  UpdateOrderInput,
} from "@/lib/orders/types";
import type { RecordKitchenEventInput } from "@/lib/kitchen/events";
import {
  buildOrderEventContext,
  getRestaurantOrderContext,
} from "@/lib/orders/context";
import { executeOrderMutationWithEvents } from "@/lib/orders/mutation";
import { prisma } from "@/lib/prisma";

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

const EDITABLE_ORDER_STATUSES = new Set([
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
]);

async function syncOrderCustomers(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  orderId: string,
  restaurantId: string,
  customers: CreateOrderCustomerInput[],
) {
  const linkedCustomers = await resolveOrderCustomers(restaurantId, customers);

  await tx.orderCustomer.deleteMany({ where: { orderId } });
  await tx.orderCustomer.createMany({
    data: linkedCustomers.map((customer) => ({
      orderId,
      customerId: customer.id,
    })),
  });

  return linkedCustomers;
}

export async function listOrders(
  restaurantId: string,
  filters?: OrdersListFilters,
  formatOptions?: OrderFormatOptions,
): Promise<OrdersListResponse> {
  const restaurant = await getRestaurantOrderContext(restaurantId);

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
      include: orderWithPaymentsInclude,
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
  const restaurant = await getRestaurantOrderContext(restaurantId);

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
    include: orderWithPaymentsInclude,
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
  const restaurant = await getRestaurantOrderContext(restaurantId);

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
    include: orderWithPaymentsInclude,
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
  const restaurant = await getRestaurantOrderContext(restaurantId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const existing = await prisma.order.findUnique({
    where: {
      restaurantId_orderNumber: {
        restaurantId,
        orderNumber: orderId,
      },
    },
    select: {
      status: true,
    },
  });

  if (!existing) {
    throw new Error("Order not found");
  }

  const nextStatus = mapUiStatusToDb(status);
  const order = await executeOrderMutationWithEvents(async (tx) => {
    const pendingEvents = buildOrderStatusChangeEvents(
      buildOrderEventContext(restaurant, restaurantId, orderId),
      existing.status,
      nextStatus,
    );
    const updatedOrder = await tx.order.update({
      where: {
        restaurantId_orderNumber: {
          restaurantId,
          orderNumber: orderId,
        },
      },
      data: {
        status: nextStatus,
      },
      include: orderWithPaymentsInclude,
    });

    return { value: updatedOrder, pendingEvents };
  });

  return mapDbOrderToUi(order, {
    currency: restaurant.currency,
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
    customerLabels: formatOptions?.customerLabels,
  });
}

export async function confirmOrder(
  restaurantId: string,
  orderId: string,
  formatOptions?: OrderFormatOptions,
): Promise<Order> {
  const restaurant = await getRestaurantOrderContext(restaurantId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const existing = await prisma.order.findUnique({
    where: {
      restaurantId_orderNumber: {
        restaurantId,
        orderNumber: orderId,
      },
    },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new Error("Order not found");
  }

  if (existing.status !== "DRAFT") {
    throw new Error("Only draft orders can be confirmed");
  }

  const nextStatus = "PENDING";
  const eventCtx = buildOrderEventContext(restaurant, restaurantId, orderId);

  const order = await executeOrderMutationWithEvents(async (tx) => {
    const pendingEvents: RecordKitchenEventInput[] = [
      ...buildOrderCreatedEvents(eventCtx, nextStatus, "confirm"),
    ];
    const updatedOrder = await tx.order.update({
      where: { id: existing.id },
      data: { status: nextStatus },
      include: orderWithPaymentsInclude,
    });

    return { value: updatedOrder, pendingEvents };
  });

  return mapDbOrderToUi(order, {
    currency: restaurant.currency,
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
    customerLabels: formatOptions?.customerLabels,
  });
}

export async function updateOrder(
  restaurantId: string,
  orderId: string,
  input: UpdateOrderInput,
  formatOptions?: OrderFormatOptions,
): Promise<Order> {
  const restaurant = await getRestaurantOrderContext(restaurantId);

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const existing = await prisma.order.findUnique({
    where: {
      restaurantId_orderNumber: {
        restaurantId,
        orderNumber: orderId,
      },
    },
    include: orderWithPaymentsInclude,
  });

  if (!existing) {
    throw new Error("Order not found");
  }

  if (!EDITABLE_ORDER_STATUSES.has(existing.status)) {
    throw new Error("Order cannot be edited in its current status");
  }

  const currentDetails =
    existing.details && typeof existing.details === "object"
      ? (existing.details as Record<string, unknown>)
      : {};

  const nextKind =
    input.kind ??
    (typeof currentDetails.kind === "string"
      ? (currentDetails.kind as import("@/lib/orders/order-kind").OrderKind)
      : "pos");
  const tableNumber =
    input.tableNumber?.trim() ?? existing.tableNumber ?? undefined;
  const resolved = resolveOrderKind(nextKind, tableNumber);
  const lineItems = input.items ?? parseStoredOrderLineItems(existing.details);
  const totals = computeOrderTotals(lineItems);

  const details = buildOrderDetailsPayload({
    items: lineItems,
    totals,
    currency: restaurant.currency,
    kind: nextKind,
    history:
      typeof currentDetails.history === "string"
        ? currentDetails.history
        : undefined,
  });

  const eventCtx = buildOrderEventContext(restaurant, restaurantId, orderId);

  const order = await executeOrderMutationWithEvents(async (tx) => {
    const pendingEvents: RecordKitchenEventInput[] = [
      buildOrderUpdatedEvent(eventCtx),
    ];

    if (input.customers) {
      await syncOrderCustomers(tx, existing.id, restaurantId, input.customers);
    }

    const updatedOrder = await tx.order.update({
      where: { id: existing.id },
      data: {
        tableNumber: tableNumber?.trim() || null,
        type: resolved.type,
        channel: resolved.channel,
        totalCents: totals.totalCents,
        notes: input.notes?.trim() ?? existing.notes,
        details: {
          ...currentDetails,
          ...details,
        },
      },
      include: orderWithPaymentsInclude,
    });

    if (input.paymentMethod && existing.payments[0]) {
      const paymentStatus = resolvePaymentStatusForOrderIntent(
        existing.status === "DRAFT" ? "draft" : "confirm",
        input.paymentMethod,
      );

      await tx.payment.update({
        where: { id: existing.payments[0].id },
        data: {
          method: mapPaymentMethodToDb(input.paymentMethod),
          status: mapPaymentStatusToDb(paymentStatus),
          amountCents: totals.totalCents,
        },
      });

      pendingEvents.push(
        buildPaymentUpdatedEvent(eventCtx, existing.payments[0].id),
      );
    } else if (input.paymentMethod) {
      const paymentStatus = resolvePaymentStatusForOrderIntent(
        existing.status === "DRAFT" ? "draft" : "confirm",
        input.paymentMethod,
      );
      const payment = await tx.payment.create({
        data: {
          orderId: existing.id,
          method: mapPaymentMethodToDb(input.paymentMethod),
          provider: mapPaymentProviderToDb("manual"),
          status: mapPaymentStatusToDb(paymentStatus),
          amountCents: totals.totalCents,
          currency: restaurant.currency,
        },
      });

      pendingEvents.push(buildPaymentCreatedEvent(eventCtx, payment.id));
    }

    return { value: updatedOrder, pendingEvents };
  });

  const refreshed = await prisma.order.findUnique({
    where: { id: order.id },
    include: orderWithPaymentsInclude,
  });

  return mapDbOrderToUi(refreshed ?? order, {
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
  const restaurant = await getRestaurantOrderContext(restaurantId);

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
  const resolved = resolveOrderKind(input.kind, input.tableNumber);
  const status = input.intent === "draft" ? "DRAFT" : "PENDING";
  const paymentStatus = resolvePaymentStatusForOrderIntent(
    input.intent,
    input.paymentMethod,
  );
  const details = buildOrderDetailsPayload({
    items: input.items,
    totals,
    currency,
    kind: input.kind,
    history: labels?.manualOrderHistory,
    timelineNow: labels?.timelineNow,
  });
  const eventCtx = buildOrderEventContext(
    restaurant,
    restaurantId,
    orderNumber,
  );

  const order = await executeOrderMutationWithEvents(async (tx) => {
    const pendingEvents: RecordKitchenEventInput[] = [
      ...buildOrderCreatedEvents(eventCtx, status, input.intent),
    ];

    const createdOrder = await tx.order.create({
      data: {
        restaurantId,
        orderNumber,
        tableNumber: input.tableNumber?.trim() || null,
        status,
        type: resolved.type,
        channel: resolved.channel,
        assignedTo,
        totalCents: totals.totalCents,
        notes: input.notes.trim(),
        details,
        customers: {
          create: linkedCustomers.map((customer) => ({
            customerId: customer.id,
          })),
        },
      },
      include: orderWithPaymentsInclude,
    });

    const payment = await tx.payment.create({
      data: {
        orderId: createdOrder.id,
        method: mapPaymentMethodToDb(input.paymentMethod),
        provider: mapPaymentProviderToDb("manual"),
        status: mapPaymentStatusToDb(paymentStatus),
        amountCents: totals.totalCents,
        currency,
      },
    });

    pendingEvents.push(buildPaymentCreatedEvent(eventCtx, payment.id));

    return {
      value: {
        ...createdOrder,
        payments: [payment],
      },
      pendingEvents,
    };
  });

  return mapDbOrderToUi(order, {
    currency: restaurant.currency,
    timezone: restaurant.timezone,
    locale: formatOptions?.locale,
    customerLabels: formatOptions?.customerLabels,
  });
}
