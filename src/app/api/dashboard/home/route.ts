import { getLocale, getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDashboardHomeData } from "@/lib/dashboard/queries";
import { requireRestaurantAccess } from "@/lib/orders/api-auth";

const querySchema = z.object({
  restaurantId: z.string().cuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    restaurantId: searchParams.get("restaurantId"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid restaurantId" },
      { status: 400 },
    );
  }

  const access = await requireRestaurantAccess(parsed.data.restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const restaurant =
    access.context.restaurants.find(
      (item) => item.id === parsed.data.restaurantId,
    ) ?? null;

  const locale = await getLocale();
  const tMetrics = await getTranslations("dashboard.metrics");
  const data = await getDashboardHomeData(restaurant, {
    locale,
    metricLabels: {
      revenueToday: tMetrics("revenueToday"),
      openOrders: tMetrics("openOrders"),
      upcomingReservations: tMetrics("upcomingReservations"),
      avgPrepTime: tMetrics("avgPrepTime"),
    },
  });

  return NextResponse.json({
    data,
    restaurantId: parsed.data.restaurantId,
    updatedAt: new Date().toISOString(),
  });
}
