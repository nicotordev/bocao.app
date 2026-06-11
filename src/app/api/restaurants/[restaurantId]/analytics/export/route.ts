import { getLocale, getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";
import { requireAnalyticsAccess } from "@/lib/analytics/api-auth";
import {
  buildAnalyticsCsv,
  buildAnalyticsCsvFilename,
} from "@/lib/analytics/export-csv";
import {
  parseAnalyticsListSearchParams,
  toAnalyticsFilters,
} from "@/lib/analytics/filters";
import { analyticsQuerySchema } from "@/lib/analytics/schema";
import { getAnalyticsDashboardData } from "@/lib/analytics/service";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { restaurantId } = await params;
  const access = await requireAnalyticsAccess(restaurantId);

  if (!access.ok) {
    return NextResponse.json(
      { error: access.error },
      { status: access.status },
    );
  }

  const activeRestaurant =
    access.context.restaurants.find(
      (restaurant) => restaurant.id === restaurantId,
    ) ?? access.context.activeRestaurant;

  if (!activeRestaurant) {
    return NextResponse.json(
      { error: "Restaurant not found" },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(request.url);
  const listFilters = parseAnalyticsListSearchParams(
    {
      preset: searchParams.get("preset") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      channel: searchParams.get("channel") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    },
    activeRestaurant.timezone,
  );

  const locale = await getLocale();

  const filters = toAnalyticsFilters(
    restaurantId,
    activeRestaurant.organizationId,
    listFilters,
    activeRestaurant.timezone,
    activeRestaurant.currency,
    locale,
  );

  const parsed = analyticsQuerySchema.safeParse({
    from: filters.from,
    to: filters.to,
    channel: listFilters.channel,
    status: listFilters.status,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }

  const t = await getTranslations("dashboard.analytics");
  const tKitchen = await getTranslations("dashboard.kitchen");

  const data = await getAnalyticsDashboardData(filters, listFilters, {
    kitchenStationLabels: {
      grill: tKitchen("stationTypes.grill"),
      fryer: tKitchen("stationTypes.fryer"),
      sushi: tKitchen("stationTypes.sushi"),
      bar: tKitchen("stationTypes.bar"),
      desserts: tKitchen("stationTypes.desserts"),
      delivery_station: tKitchen("stationTypes.delivery"),
    },
  });

  const csv = buildAnalyticsCsv(data, {
    channelLabels: {
      pos: t("channels.pos"),
      whatsapp: t("channels.whatsapp"),
      web: t("channels.web"),
      delivery: t("channels.delivery"),
      manual: t("channels.manual"),
    },
  });
  const filename = buildAnalyticsCsvFilename(listFilters.from, listFilters.to);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
