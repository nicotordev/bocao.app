"use server";

import { getDashboardContext } from "@/lib/dashboard/context";
import {
  createProductFlowBlock,
  createProductFlowTemplate,
  deleteProductFlowBlock,
  deleteProductFlowTemplate,
  deleteProductPurchaseFlow,
  listProductFlowBlocks,
  listProductFlowTemplates,
  getProductPurchaseFlow,
  updateProductFlowBlock,
  updateProductFlowTemplate,
  upsertProductPurchaseFlow,
} from "@/lib/product-flow/repository";
import {
  createFlowBlockSchema,
  createFlowTemplateSchema,
  deleteFlowBlockSchema,
  deleteFlowTemplateSchema,
  deleteProductFlowSchema,
  updateFlowBlockSchema,
  updateFlowTemplateSchema,
  upsertProductFlowSchema,
} from "@/lib/product-flow/schemas";
import { PERMISSIONS } from "@/lib/rbac/permissions";

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

export async function listProductFlowDataAction(restaurantId: string) {
  await requireMenuRead(restaurantId);

  const [blocks, templates] = await Promise.all([
    listProductFlowBlocks(restaurantId),
    listProductFlowTemplates(restaurantId),
  ]);

  return { blocks, templates };
}

export async function getProductPurchaseFlowAction(input: {
  restaurantId: string;
  menuItemId: string;
}) {
  if (!input.restaurantId || !input.menuItemId) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuRead(input.restaurantId);

  const flow = await getProductPurchaseFlow(
    input.restaurantId,
    input.menuItemId,
  );

  return { flow };
}

export async function createFlowBlockAction(
  input: {
    restaurantId: string;
    key: string;
    type: import("@/lib/product-flow/types").FlowBlockType;
    config: import("@/lib/product-flow/types").FlowBlockConfig;
  } & import("@/lib/product-flow/types").FlowLibraryScopeInput,
) {
  const parsed = createFlowBlockSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const block = await createProductFlowBlock(
    parsed.data.restaurantId,
    parsed.data.scopeType === "category"
      ? {
          key: parsed.data.key,
          type: parsed.data.type,
          config: parsed.data.config,
          scopeType: "category",
          categoryId: parsed.data.categoryId,
        }
      : {
          key: parsed.data.key,
          type: parsed.data.type,
          config: parsed.data.config,
          scopeType: "menu_item",
          menuItemId: parsed.data.menuItemId,
        },
  );

  return { block };
}

export async function updateFlowBlockAction(
  input: {
    restaurantId: string;
    blockId: string;
    key?: string;
    type?: import("@/lib/product-flow/types").FlowBlockType;
    config?: import("@/lib/product-flow/types").FlowBlockConfig;
    isActive?: boolean;
  } & Partial<import("@/lib/product-flow/types").FlowLibraryScopeInput>,
) {
  const parsed = updateFlowBlockSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const block = await updateProductFlowBlock(
    parsed.data.restaurantId,
    parsed.data.blockId,
    {
      key: parsed.data.key,
      type: parsed.data.type,
      config: parsed.data.config,
      isActive: parsed.data.isActive,
      scopeType: parsed.data.scopeType,
      categoryId: parsed.data.categoryId,
      menuItemId: parsed.data.menuItemId,
    },
  );

  return { block };
}

export async function deleteFlowBlockAction(input: {
  restaurantId: string;
  blockId: string;
}) {
  const parsed = deleteFlowBlockSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  await deleteProductFlowBlock(parsed.data.restaurantId, parsed.data.blockId);

  return { success: true };
}

export async function createFlowTemplateAction(
  input: {
    restaurantId: string;
    name: string;
    description?: string;
    steps: import("@/lib/product-flow/types").FlowStep[];
  } & import("@/lib/product-flow/types").FlowLibraryScopeInput,
) {
  const parsed = createFlowTemplateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const template = await createProductFlowTemplate(
    parsed.data.restaurantId,
    parsed.data.scopeType === "category"
      ? {
          name: parsed.data.name,
          description: parsed.data.description,
          steps: parsed.data.steps,
          scopeType: "category",
          categoryId: parsed.data.categoryId,
        }
      : {
          name: parsed.data.name,
          description: parsed.data.description,
          steps: parsed.data.steps,
          scopeType: "menu_item",
          menuItemId: parsed.data.menuItemId,
        },
  );

  return { template };
}

export async function updateFlowTemplateAction(
  input: {
    restaurantId: string;
    templateId: string;
    name?: string;
    description?: string | null;
    steps?: import("@/lib/product-flow/types").FlowStep[];
    isActive?: boolean;
  } & Partial<import("@/lib/product-flow/types").FlowLibraryScopeInput>,
) {
  const parsed = updateFlowTemplateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const template = await updateProductFlowTemplate(
    parsed.data.restaurantId,
    parsed.data.templateId,
    {
      name: parsed.data.name,
      description: parsed.data.description,
      steps: parsed.data.steps,
      isActive: parsed.data.isActive,
      scopeType: parsed.data.scopeType,
      categoryId: parsed.data.categoryId,
      menuItemId: parsed.data.menuItemId,
    },
  );

  return { template };
}

export async function deleteFlowTemplateAction(input: {
  restaurantId: string;
  templateId: string;
}) {
  const parsed = deleteFlowTemplateSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  await deleteProductFlowTemplate(
    parsed.data.restaurantId,
    parsed.data.templateId,
  );

  return { success: true };
}

export async function upsertProductFlowAction(input: {
  restaurantId: string;
  menuItemId: string;
  isActive: boolean;
  steps: import("@/lib/product-flow/types").FlowStep[];
}) {
  const parsed = upsertProductFlowSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  const flow = await upsertProductPurchaseFlow(
    parsed.data.restaurantId,
    parsed.data.menuItemId,
    {
      isActive: parsed.data.isActive,
      steps: parsed.data.steps,
    },
  );

  return { flow };
}

export async function deleteProductFlowAction(input: {
  restaurantId: string;
  menuItemId: string;
}) {
  const parsed = deleteProductFlowSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("INVALID_INPUT");
  }

  await requireMenuWrite(parsed.data.restaurantId);

  await deleteProductPurchaseFlow(
    parsed.data.restaurantId,
    parsed.data.menuItemId,
  );

  return { success: true };
}
