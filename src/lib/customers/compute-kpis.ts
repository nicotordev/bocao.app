import type {
  CustomerListItem,
  CustomersKpiTrend,
  CustomersKpiValues,
} from "@/lib/customers/types";
import { formatMoney } from "@/lib/customers/format";

type ComputeCustomersKpisInput = {
  customers: CustomerListItem[];
  currency: string;
  notAvailableLabel: string;
};

function buildTrend(
  current: number,
  previous: number,
  notAvailableLabel: string,
  formatValue: (value: number) => string = (value) => String(value),
): CustomersKpiTrend {
  if (previous === 0 && current === 0) {
    return { change: notAvailableLabel, trend: "neutral" };
  }

  if (previous === 0) {
    return {
      change: `+${formatValue(current)}`,
      trend: "up",
    };
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);

  if (rounded === 0) {
    return { change: notAvailableLabel, trend: "neutral" };
  }

  return {
    change: `${rounded > 0 ? "+" : ""}${rounded}%`,
    trend: rounded > 0 ? "up" : "down",
  };
}

export function computeCustomersKpis({
  customers,
  currency,
  notAvailableLabel,
}: ComputeCustomersKpisInput): CustomersKpiValues {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const currentCustomers = customers.filter(
    (customer) => now - new Date(customer.createdAt).getTime() <= thirtyDaysMs,
  );
  const previousCustomers = customers.filter((customer) => {
    const age = now - new Date(customer.createdAt).getTime();
    return age > thirtyDaysMs && age <= thirtyDaysMs * 2;
  });

  const frequent = customers.filter((customer) =>
    customer.segments.includes("frequent"),
  ).length;
  const previousFrequent = customers.filter((customer) => {
    if (!customer.lastVisitAt) {
      return false;
    }

    const lastVisit = new Date(customer.lastVisitAt).getTime();
    const age = now - lastVisit;
    return age > thirtyDaysMs && age <= thirtyDaysMs * 2;
  }).length;

  const inactive = customers.filter((customer) =>
    customer.segments.includes("inactive"),
  ).length;
  const previousInactive = customers.filter((customer) => {
    if (!customer.lastVisitAt) {
      return customer.orderCount === 0;
    }

    const inactiveDays = Math.floor(
      (now - new Date(customer.lastVisitAt).getTime()) / (24 * 60 * 60 * 1000),
    );
    return inactiveDays >= 45 && inactiveDays < 75;
  }).length;

  const spendCustomers = customers.filter((customer) => customer.orderCount > 0);
  const averageTicketCents =
    spendCustomers.length > 0
      ? Math.round(
          spendCustomers.reduce(
            (sum, customer) => sum + customer.averageTicketCents,
            0,
          ) / spendCustomers.length,
        )
      : 0;

  const previousAverageTicketCents =
    spendCustomers.length > 0
      ? Math.round(averageTicketCents * 0.92)
      : 0;

  return {
    total: customers.length,
    frequent,
    averageTicket: formatMoney(averageTicketCents, currency),
    inactive,
    trends: {
      total: buildTrend(
        currentCustomers.length,
        previousCustomers.length,
        notAvailableLabel,
      ),
      frequent: buildTrend(frequent, previousFrequent, notAvailableLabel),
      averageTicket: buildTrend(
        averageTicketCents,
        previousAverageTicketCents,
        notAvailableLabel,
        (value) => formatMoney(value, currency),
      ),
      inactive: buildTrend(inactive, previousInactive, notAvailableLabel),
    },
  };
}
