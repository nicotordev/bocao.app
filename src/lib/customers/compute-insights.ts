import type { CustomerInsight, CustomerListItem } from "@/lib/customers/types";

export function computeCustomerInsights(
  customers: CustomerListItem[],
): CustomerInsight[] {
  const insights: CustomerInsight[] = [];

  const frequentDeclining = customers.filter((customer) => {
    if (!customer.segments.includes("frequent")) {
      return false;
    }

    if (!customer.lastVisitAt) {
      return false;
    }

    const daysSinceVisit = Math.floor(
      (Date.now() - new Date(customer.lastVisitAt).getTime()) /
        (24 * 60 * 60 * 1000),
    );

    return daysSinceVisit >= 7 && daysSinceVisit < 30;
  }).length;

  if (frequentDeclining > 0) {
    insights.push({
      id: "frequent-declining",
      messageKey: "insights.frequentDeclining",
      messageValues: { count: frequentDeclining },
    });
  }

  const whatsappCustomers = customers.filter(
    (customer) => customer.primaryChannel === "whatsapp" && customer.orderCount > 0,
  );
  const otherCustomers = customers.filter(
    (customer) => customer.primaryChannel !== "whatsapp" && customer.orderCount > 0,
  );

  if (whatsappCustomers.length > 0 && otherCustomers.length > 0) {
    const whatsappAvg =
      whatsappCustomers.reduce(
        (sum, customer) => sum + customer.averageTicketCents,
        0,
      ) / whatsappCustomers.length;
    const otherAvg =
      otherCustomers.reduce(
        (sum, customer) => sum + customer.averageTicketCents,
        0,
      ) / otherCustomers.length;

    if (otherAvg > 0) {
      const uplift = Math.round(((whatsappAvg - otherAvg) / otherAvg) * 100);

      if (uplift !== 0) {
        insights.push({
          id: "whatsapp-spend",
          messageKey: "insights.whatsappSpend",
          messageValues: { percent: Math.abs(uplift) },
        });
      }
    }
  }

  const inactiveVip = customers.filter(
    (customer) =>
      customer.segments.includes("vip") &&
      customer.segments.includes("inactive"),
  ).length;

  if (inactiveVip > 0) {
    insights.push({
      id: "inactive-vip",
      messageKey: "insights.inactiveVip",
      messageValues: { count: inactiveVip },
    });
  }

  const highValueCustomers = customers.filter((customer) =>
    customer.segments.includes("high_value"),
  );

  if (highValueCustomers.length >= 3) {
    const topDish = highValueCustomers
      .flatMap((customer) => customer.favoriteDishes)
      .reduce<Record<string, number>>((counts, dish) => {
        counts[dish] = (counts[dish] ?? 0) + 1;
        return counts;
      }, {});

    const [dishName] =
      Object.entries(topDish).sort((left, right) => right[1] - left[1])[0] ?? [];

    if (dishName) {
      insights.push({
        id: "high-value-promo",
        messageKey: "insights.highValuePromo",
        messageValues: { dish: dishName },
      });
    }
  }

  return insights.slice(0, 4);
}
