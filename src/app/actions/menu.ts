"use server";

import { getDashboardContext } from "@/lib/dashboard/context";
import {
  createMenuCategory,
  createMenuItem,
  deleteMenuCategory,
  deleteMenuItem,
  reorderMenuLayout,
  updateMenuCategory,
  updateMenuItem,
  updateMenuItemImages,
} from "@/lib/menu/repository";
import {
  createMenuCategorySchema,
  createMenuItemSchema,
  deleteMenuCategorySchema,
  deleteMenuItemSchema,
  reorderMenuLayoutSchema,
  updateMenuCategorySchema,
  updateMenuItemImagesSchema,
  updateMenuItemSchema,
} from "@/lib/menu/schemas";
import type { MenuItemFieldTranslations } from "@/lib/menu/item-translations";
import type { MenuItemTag } from "@/lib/menu/tag-types";
import { listMenuCustomTags } from "@/lib/menu/custom-tags.server";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { uploadImageToR2 } from "@/lib/upload/image-upload";

function requireMenuWrite(restaurantId: string) {
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
      PERMISSIONS.MENU_WRITE,
    );

    if (!canWrite) {
      throw new Error("FORBIDDEN");
    }

    return context;
  });
}

function requireMenuRead(restaurantId: string) {
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

    const canRead = context.membership.permissions.includes(
      PERMISSIONS.MENU_READ,
    );

    if (!canRead) {
      throw new Error("FORBIDDEN");
    }

    return context;
  });
}

export async function uploadMenuItemImageAction(formData: FormData) {
  const restaurantId = formData.get("restaurantId");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    throw new Error("INVALID_RESTAURANT");
  }

  await requireMenuWrite(restaurantId);

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("NO_FILE");
  }

  try {
    const url = await uploadImageToR2(file, `menu-items/${restaurantId}`);

    return { url };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_IMAGE_TYPE") {
        throw new Error("INVALID_IMAGE_TYPE");
      }

      if (error.message === "IMAGE_TOO_LARGE") {
        throw new Error("IMAGE_TOO_LARGE");
      }

      if (error.message === "R2_NOT_CONFIGURED") {
        throw new Error("R2_NOT_CONFIGURED");
      }
    }

    throw new Error("UPLOAD_FAILED");
  }
}

export async function updateMenuItemImagesAction(input: {
  restaurantId: string;
  menuItemId: string;
  images: string[];
}) {
  const parsed = updateMenuItemImagesSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const item = await updateMenuItemImages(
    parsed.data.restaurantId,
    parsed.data.menuItemId,
    parsed.data.images,
  );

  return { item };
}

export async function createMenuCategoryAction(input: {
  restaurantId: string;
  name: string;
}) {
  const parsed = createMenuCategorySchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const category = await createMenuCategory(parsed.data.restaurantId, {
    name: parsed.data.name,
  });

  return { category };
}

export async function updateMenuCategoryAction(input: {
  restaurantId: string;
  categoryId: string;
  name?: string;
  isActive?: boolean;
}) {
  const parsed = updateMenuCategorySchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const category = await updateMenuCategory(
    parsed.data.restaurantId,
    parsed.data.categoryId,
    {
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    },
  );

  return { category };
}

export async function deleteMenuCategoryAction(input: {
  restaurantId: string;
  categoryId: string;
}) {
  const parsed = deleteMenuCategorySchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  await deleteMenuCategory(parsed.data.restaurantId, parsed.data.categoryId);

  return { success: true };
}

export async function createMenuItemAction(input: {
  restaurantId: string;
  categoryId: string;
  priceCents: number;
  isAvailable: boolean;
  images: string[];
  tags?: MenuItemTag[];
  translations: MenuItemFieldTranslations;
}) {
  const parsed = createMenuItemSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const item = await createMenuItem(parsed.data.restaurantId, parsed.data);

  const customTagDefinitions = await listMenuCustomTags(
    parsed.data.restaurantId,
  );

  return { item, customTagDefinitions };
}

export async function updateMenuItemAction(input: {
  restaurantId: string;
  menuItemId: string;
  categoryId?: string;
  priceCents?: number;
  isAvailable?: boolean;
  images?: string[];
  tags?: MenuItemTag[];
  translations?: MenuItemFieldTranslations;
}) {
  const parsed = updateMenuItemSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const item = await updateMenuItem(
    parsed.data.restaurantId,
    parsed.data.menuItemId,
    parsed.data,
  );

  const customTagDefinitions = await listMenuCustomTags(
    parsed.data.restaurantId,
  );

  return { item, customTagDefinitions };
}

export async function deleteMenuItemAction(input: {
  restaurantId: string;
  menuItemId: string;
}) {
  const parsed = deleteMenuItemSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  await deleteMenuItem(parsed.data.restaurantId, parsed.data.menuItemId);

  return { success: true };
}

export async function reorderMenuLayoutAction(input: {
  restaurantId: string;
  categories: Array<{ id: string; sortOrder: number }>;
  items: Array<{ id: string; categoryId: string; sortOrder: number }>;
}) {
  const parsed = reorderMenuLayoutSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  await reorderMenuLayout(parsed.data.restaurantId, {
    categories: parsed.data.categories,
    items: parsed.data.items,
  });

  return { success: true };
}

export async function uploadOrderItemImageAction(formData: FormData) {
  const sessionContext = await getDashboardContext();

  if (!sessionContext) {
    throw new Error("UNAUTHORIZED");
  }

  const restaurantId = formData.get("restaurantId");

  if (typeof restaurantId !== "string" || restaurantId.length === 0) {
    throw new Error("INVALID_RESTAURANT");
  }

  const allowed = sessionContext.restaurants.some(
    (restaurant) => restaurant.id === restaurantId,
  );

  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  const canWrite = sessionContext.membership.permissions.includes(
    PERMISSIONS.ORDERS_WRITE,
  );

  if (!canWrite) {
    throw new Error("FORBIDDEN");
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("NO_FILE");
  }

  try {
    const url = await uploadImageToR2(file, `order-items/${restaurantId}`);

    return { url };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_IMAGE_TYPE") {
        throw new Error("INVALID_IMAGE_TYPE");
      }

      if (error.message === "IMAGE_TOO_LARGE") {
        throw new Error("IMAGE_TOO_LARGE");
      }

      if (error.message === "R2_NOT_CONFIGURED") {
        throw new Error("R2_NOT_CONFIGURED");
      }
    }

    throw new Error("UPLOAD_FAILED");
  }
}

export async function refreshMenuPageAction(restaurantId: string) {
  await requireMenuRead(restaurantId);

  const { listMenuCategories, listMenuItemRecords } =
    await import("@/lib/menu/repository");

  const {
    listProductFlowBlocks,
    listProductFlowTemplates,
    listProductPurchaseFlows,
  } = await import("@/lib/product-flow/repository");

  const [categories, items, customTagDefinitions, flowBlocks, flowTemplates, flows] =
    await Promise.all([
      listMenuCategories(restaurantId),
      listMenuItemRecords(restaurantId, { availableOnly: false }),
      listMenuCustomTags(restaurantId),
      listProductFlowBlocks(restaurantId),
      listProductFlowTemplates(restaurantId),
      listProductPurchaseFlows(restaurantId),
    ]);

  const productFlowsByMenuItemId = Object.fromEntries(
    flows.map((flow) => [flow.menuItemId, flow]),
  );

  return {
    categories,
    items,
    customTagDefinitions,
    flowBlocks,
    flowTemplates,
    productFlowsByMenuItemId,
  };
}
