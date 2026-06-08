import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  DEMO_ORGANIZATION_NAME,
  DEMO_ORGANIZATION_SLUG,
} from "../src/lib/demo/constants";
import { PERMISSION_CATALOG } from "../src/lib/rbac/permissions";
import { seedOrganizationRoles } from "../src/lib/rbac/seed-organization-roles";
import { ensureDemoAdminMemberships } from "./seed/admin-memberships";
import {
  buildDemoProfile,
  DEMO_MENU,
  DEMO_ORDERS,
  DEMO_RESERVATIONS,
  DEMO_RESTAURANTS,
} from "./seed/demo-data";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function seedDemoFloorPlan(restaurantId: string) {
  const boundary = [
    { x: 0.08, y: 0.12 },
    { x: 0.92, y: 0.12 },
    { x: 0.92, y: 0.88 },
    { x: 0.08, y: 0.88 },
  ];

  const tableSeeds = [
    { number: "1", positionX: 0.22, positionY: 0.28, shape: "ROUND" as const },
    { number: "2", positionX: 0.38, positionY: 0.28, shape: "ROUND" as const },
    { number: "3", positionX: 0.54, positionY: 0.28, shape: "ROUND" as const },
    { number: "4", positionX: 0.7, positionY: 0.28, shape: "ROUND" as const },
    { number: "6", positionX: 0.22, positionY: 0.52, shape: "SQUARE" as const },
    { number: "8", positionX: 0.46, positionY: 0.52, shape: "RECT" as const, width: 0.12, height: 0.07 },
    { number: "10", positionX: 0.7, positionY: 0.52, shape: "SQUARE" as const },
    { number: "12", positionX: 0.46, positionY: 0.74, shape: "ROUND" as const },
  ];

  const surface = await prisma.diningSurface.upsert({
    where: { id: `${restaurantId}-surface-main` },
    update: {
      name: "Salón principal",
      floor: 1,
      surfaceAreaM2: 45,
      boundary,
    },
    create: {
      id: `${restaurantId}-surface-main`,
      restaurantId,
      name: "Salón principal",
      floor: 1,
      surfaceAreaM2: 45,
      boundary,
    },
  });

  await prisma.diningTable.deleteMany({
    where: { surfaceId: surface.id },
  });

  await prisma.diningTable.createMany({
    data: tableSeeds.map((table, index) => ({
      id: `${restaurantId}-table-${table.number}`,
      surfaceId: surface.id,
      number: table.number,
      shape: table.shape,
      capacity: table.shape === "RECT" ? 6 : 4,
      positionX: table.positionX,
      positionY: table.positionY,
      rotation: 0,
      width: table.width ?? 0.08,
      height: table.height ?? 0.08,
      sortOrder: index,
    })),
  });
}

async function seedPermissions() {
  for (const permission of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        module: permission.module,
        description: permission.description,
      },
      create: {
        key: permission.key,
        module: permission.module,
        description: permission.description,
      },
    });
  }
}

async function seedDemoOrganization() {
  const organization = await prisma.organization.upsert({
    where: { slug: DEMO_ORGANIZATION_SLUG },
    update: {
      name: DEMO_ORGANIZATION_NAME,
      country: "CL",
    },
    create: {
      name: DEMO_ORGANIZATION_NAME,
      slug: DEMO_ORGANIZATION_SLUG,
      country: "CL",
    },
  });

  await seedOrganizationRoles(prisma, organization.id);

  const restaurantsBySlug: Record<string, string> = {};

  for (const restaurantSeed of DEMO_RESTAURANTS) {
    const existing = await prisma.restaurant.findFirst({
      where: {
        organizationId: organization.id,
        name: restaurantSeed.name,
      },
      select: { id: true },
    });

    const restaurant =
      existing ??
      (await prisma.restaurant.create({
        data: {
          organizationId: organization.id,
          name: restaurantSeed.name,
          city: restaurantSeed.city,
          currency: restaurantSeed.currency,
          timezone: restaurantSeed.timezone,
          businessType: "RESTAURANT",
          primaryGoal: "ORDERS",
        },
        select: { id: true },
      }));

    restaurantsBySlug[restaurantSeed.slug] = restaurant.id;

    const profile = buildDemoProfile(restaurantSeed.name);

    await prisma.restaurantDemoProfile.upsert({
      where: { restaurantId: restaurant.id },
      update: {
        insights: profile.insights,
        orderInsights: profile.orderInsights,
        whatsapp: profile.whatsapp,
        teamActivity: profile.teamActivity,
        metricTrends: profile.metricTrends,
      },
      create: {
        restaurantId: restaurant.id,
        insights: profile.insights,
        orderInsights: profile.orderInsights,
        whatsapp: profile.whatsapp,
        teamActivity: profile.teamActivity,
        metricTrends: profile.metricTrends,
      },
    });
  }

  const primaryRestaurantId = restaurantsBySlug.providencia;

  if (!primaryRestaurantId) {
    throw new Error("Primary demo restaurant was not created");
  }

  for (const [categoryIndex, categorySeed] of DEMO_MENU.entries()) {
    const category = await prisma.menuCategory.upsert({
      where: {
        id: `${primaryRestaurantId}-menu-cat-${categoryIndex + 1}`,
      },
      update: {
        name: categorySeed.name,
        sortOrder: categoryIndex,
        isActive: true,
      },
      create: {
        id: `${primaryRestaurantId}-menu-cat-${categoryIndex + 1}`,
        restaurantId: primaryRestaurantId,
        name: categorySeed.name,
        sortOrder: categoryIndex,
        isActive: true,
      },
    });

    for (const [itemIndex, itemSeed] of categorySeed.items.entries()) {
      await prisma.menuItem.upsert({
        where: {
          id: `${primaryRestaurantId}-menu-item-${categoryIndex + 1}-${itemIndex + 1}`,
        },
        update: {
          name: itemSeed.name,
          description: itemSeed.description ?? null,
          priceCents: itemSeed.priceCents,
          images: itemSeed.images ?? [],
          isAvailable: true,
          categoryId: category.id,
        },
        create: {
          id: `${primaryRestaurantId}-menu-item-${categoryIndex + 1}-${itemIndex + 1}`,
          restaurantId: primaryRestaurantId,
          categoryId: category.id,
          name: itemSeed.name,
          description: itemSeed.description ?? null,
          priceCents: itemSeed.priceCents,
          images: itemSeed.images ?? [],
          isAvailable: true,
        },
      });
    }
  }

  await seedDemoFloorPlan(primaryRestaurantId);

  for (const orderSeed of DEMO_ORDERS) {
    const customerNames = [
      orderSeed.customerName,
      ...(orderSeed.additionalCustomerNames ?? []),
    ];
    const linkedCustomers = [];

    for (const [index, name] of customerNames.entries()) {
      const customer = await prisma.customer.upsert({
        where: {
          id: `${primaryRestaurantId}-${orderSeed.orderNumber}-${index}`,
        },
        update: {
          name,
          phone: index === 0 ? orderSeed.phone : null,
        },
        create: {
          id: `${primaryRestaurantId}-${orderSeed.orderNumber}-${index}`,
          restaurantId: primaryRestaurantId,
          name,
          phone: index === 0 ? orderSeed.phone : null,
        },
      });

      linkedCustomers.push(customer);
    }

    const createdAt = new Date(Date.now() - orderSeed.minutesAgo * 60_000);

    await prisma.order.upsert({
      where: {
        restaurantId_orderNumber: {
          restaurantId: primaryRestaurantId,
          orderNumber: orderSeed.orderNumber,
        },
      },
      update: {
        tableNumber: orderSeed.tableNumber ?? null,
        status: orderSeed.status,
        channel: orderSeed.channel,
        assignedTo: orderSeed.assignedTo,
        totalCents: orderSeed.totalCents,
        preparationMins: orderSeed.preparationMins,
        notes: orderSeed.notes,
        details: orderSeed.details,
        createdAt,
        customers: {
          deleteMany: {},
          create: linkedCustomers.map((customer) => ({
            customerId: customer.id,
          })),
        },
      },
      create: {
        restaurantId: primaryRestaurantId,
        orderNumber: orderSeed.orderNumber,
        tableNumber: orderSeed.tableNumber ?? null,
        status: orderSeed.status,
        channel: orderSeed.channel,
        assignedTo: orderSeed.assignedTo,
        totalCents: orderSeed.totalCents,
        preparationMins: orderSeed.preparationMins,
        notes: orderSeed.notes,
        details: orderSeed.details,
        createdAt,
        customers: {
          create: linkedCustomers.map((customer) => ({
            customerId: customer.id,
          })),
        },
      },
    });
  }

  await prisma.reservation.deleteMany({
    where: { restaurantId: primaryRestaurantId },
  });

  for (const [index, reservationSeed] of DEMO_RESERVATIONS.entries()) {
    await prisma.reservation.create({
      data: {
        id: `${primaryRestaurantId}-res-${index + 1}`,
        restaurantId: primaryRestaurantId,
        guestName: reservationSeed.guestName,
        guestCount: reservationSeed.guestCount,
        status: reservationSeed.status,
        scheduledAt: new Date(
          Date.now() + reservationSeed.minutesFromNow * 60_000,
        ),
      },
    });
  }

  const attachedAdmins = await ensureDemoAdminMemberships(
    prisma,
    organization.id,
  );

  console.log(`Demo organization: ${organization.slug} (${organization.id})`);
  console.log(`Demo restaurants: ${Object.keys(restaurantsBySlug).length}`);
  console.log(`Demo orders: ${DEMO_ORDERS.length}`);
  console.log(`Demo reservations: ${DEMO_RESERVATIONS.length}`);
  console.log(`Admin memberships attached: ${attachedAdmins}`);
}

async function main() {
  await seedPermissions();
  await seedDemoOrganization();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
