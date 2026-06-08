"use server";

import { getDashboardContext } from "@/lib/dashboard/context";
import { saveFloorPlan } from "@/lib/floor-plan/repository";
import { saveFloorPlanSchema } from "@/lib/floor-plan/schemas";
import { PERMISSIONS } from "@/lib/rbac/permissions";

function requireRestaurantWrite(restaurantId: string) {
  return getDashboardContext().then((context) => {
    if (!context) {
      throw new Error("UNAUTHORIZED");
    }

    const allowed = context.restaurants.some(
      (restaurant) => restaurant.id === restaurantId,
    );

    if (!allowed) {
      throw new Error("FORBIDDEN");
    }

    const canWrite = context.membership.permissions.includes(
      PERMISSIONS.RESTAURANT_WRITE,
    );

    if (!canWrite) {
      throw new Error("FORBIDDEN");
    }

    return context;
  });
}

export async function saveFloorPlanAction(input: unknown) {
  const parsed = saveFloorPlanSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireRestaurantWrite(parsed.data.restaurantId);

  const surface = await saveFloorPlan(parsed.data);

  return { surface };
}
