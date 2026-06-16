import "server-only";

import { generateCustomerSmartSegments } from "@/lib/customers/smart-segments/ai/generate-smart-segments";
import {
  buildSegmentContext,
  mapCustomerRecord,
} from "@/lib/customers/mapper";
import {
  listRestaurantsForSmartSegmentsCron,
  upsertCustomerSmartSegmentSnapshot,
} from "@/lib/customers/smart-segments/repository";
import { getSupportedSmartSegmentLocales } from "@/lib/customers/smart-segments/locales";
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
    orderBy: { createdAt: "desc" as const },
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
};

export type CustomerSmartSegmentsCronResult = {
  processed: number;
  generated: number;
  skipped: number;
  errors: Array<{ restaurantId: string; locale: string; error: string }>;
};

function resolveLocalesForRestaurant(contentLocales: string[]) {
  const supported = new Set<string>(getSupportedSmartSegmentLocales());
  const locales = contentLocales.filter((locale) => supported.has(locale));

  return locales.length > 0 ? locales : getSupportedSmartSegmentLocales();
}

export async function runCustomerSmartSegmentsCron(): Promise<CustomerSmartSegmentsCronResult> {
  const restaurants = await listRestaurantsForSmartSegmentsCron();
  const result: CustomerSmartSegmentsCronResult = {
    processed: 0,
    generated: 0,
    skipped: 0,
    errors: [],
  };

  for (const restaurant of restaurants) {
    const locales = resolveLocalesForRestaurant(restaurant.contentLocales);

    for (const locale of locales) {
      result.processed += 1;

      try {
        const records = await prisma.customer.findMany({
          where: { restaurantId: restaurant.id },
          include: customerInclude,
          orderBy: [{ name: "asc" }],
        });

        const preliminary = records.map((record) =>
          mapCustomerRecord(
            record,
            { restaurantAverageTicketCents: 0, spendPercentile90Cents: 0 },
            {
              currency: restaurant.currency,
              timezone: restaurant.timezone,
              locale,
              neverLabel: locale === "es" ? "Sin visitas" : "No visits yet",
            },
          ),
        );

        const segmentContext = buildSegmentContext(preliminary);
        const customers = records.map((record, index) =>
          mapCustomerRecord(record, segmentContext, {
            currency: restaurant.currency,
            timezone: restaurant.timezone,
            locale,
            neverLabel: locale === "es" ? "Sin visitas" : "No visits yet",
          }),
        );

        const activeCustomers = customers.filter(
          (customer) =>
            customer.orderCount > 0 || customer.reservationCount > 0,
        );

        if (activeCustomers.length === 0) {
          result.skipped += 1;
          continue;
        }

        const { segments, source } = await generateCustomerSmartSegments({
          restaurantName: restaurant.name,
          locale,
          currency: restaurant.currency,
          customers: activeCustomers,
        });

        if (segments.length === 0) {
          result.skipped += 1;
          continue;
        }

        await upsertCustomerSmartSegmentSnapshot(
          {
            restaurantId: restaurant.id,
            locale,
          },
          { segments, source },
        );

        result.generated += 1;
      } catch (error) {
        result.errors.push({
          restaurantId: restaurant.id,
          locale,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  return result;
}
