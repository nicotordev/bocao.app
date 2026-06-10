import type { NewOrderPageClientProps } from "@/components/dashboard/orders/new/types";
import { listCustomers } from "@/lib/customers/repository";
import {
  getFloorPlan,
  getOccupiedTableNumbers,
} from "@/lib/floor-plan/repository";
import { getNewOrderLabels } from "@/lib/orders/new-order-labels";
import { listMenuItemsWithPurchaseFlows } from "@/lib/product-flow/repository";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import {
  buildRestaurantLocaleOptions,
  DEFAULT_CONTENT_LOCALES,
  getRestaurantContentLocales,
} from "@/lib/restaurant/content-locales";

type GetNewOrderPageDataInput = {
  restaurantId: string;
  currency: string;
  permissions: readonly string[];
  uiLocale: string;
  initialTableNumber?: string;
};

export async function getNewOrderPageData({
  restaurantId,
  currency,
  permissions,
  uiLocale,
  initialTableNumber,
}: GetNewOrderPageDataInput): Promise<NewOrderPageClientProps> {
  const labels = await getNewOrderLabels();
  const canCreate = permissions.includes(PERMISSIONS.ORDERS_WRITE);

  const [menuItems, contentLocales, customers, floorPlan, occupiedTableNumbers] =
    restaurantId
      ? await Promise.all([
          listMenuItemsWithPurchaseFlows(restaurantId),
          getRestaurantContentLocales(restaurantId),
          listCustomers(restaurantId),
          getFloorPlan(restaurantId),
          getOccupiedTableNumbers(restaurantId),
        ])
      : [[], DEFAULT_CONTENT_LOCALES, [], null, {}];

  const localeOptions = buildRestaurantLocaleOptions(contentLocales, uiLocale);

  return {
    labels,
    restaurantId,
    currency,
    canCreate,
    menuItems,
    customers,
    floorPlanSurface: floorPlan?.surfaces[0] ?? null,
    occupiedTableNumbers,
    initialTableNumber,
    localeOptions,
  };
}
