import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  filterFlowBlocksForMenuItem,
  mapDbBlockType,
  mapDbFlowLibraryScope,
  mapUiBlockTypeToDb,
  mapUiFlowLibraryScopeToDb,
} from "./engine";
import type {
  FlowBlockConfig,
  FlowLibraryScopeInput,
  FlowStep,
  ProductFlowBlockRecord,
  ProductFlowTemplateRecord,
  ProductPurchaseFlowRecord,
} from "./types";

function parseFlowBlockConfig(value: Prisma.JsonValue): FlowBlockConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid flow block config");
  }

  return value as FlowBlockConfig;
}

function parseFlowSteps(value: Prisma.JsonValue): FlowStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as FlowStep[];
}

function mapFlowBlock(block: {
  id: string;
  scopeType: string;
  categoryId: string | null;
  menuItemId: string | null;
  key: string;
  type: string;
  config: Prisma.JsonValue;
  sortOrder: number;
  isActive: boolean;
}): ProductFlowBlockRecord {
  return {
    id: block.id,
    scopeType: mapDbFlowLibraryScope(block.scopeType),
    categoryId: block.categoryId,
    menuItemId: block.menuItemId,
    key: block.key,
    type: mapDbBlockType(block.type),
    config: parseFlowBlockConfig(block.config),
    sortOrder: block.sortOrder,
    isActive: block.isActive,
  };
}

function mapFlowTemplate(template: {
  id: string;
  scopeType: string;
  categoryId: string | null;
  menuItemId: string | null;
  name: string;
  description: string | null;
  steps: Prisma.JsonValue;
  sortOrder: number;
  isActive: boolean;
}): ProductFlowTemplateRecord {
  return {
    id: template.id,
    scopeType: mapDbFlowLibraryScope(template.scopeType),
    categoryId: template.categoryId,
    menuItemId: template.menuItemId,
    name: template.name,
    description: template.description,
    steps: parseFlowSteps(template.steps),
    sortOrder: template.sortOrder,
    isActive: template.isActive,
  };
}

function scopeWhere(restaurantId: string, scope?: FlowLibraryScopeInput) {
  if (!scope) {
    return { restaurantId };
  }

  if (scope.scopeType === "category") {
    return {
      restaurantId,
      scopeType: mapUiFlowLibraryScopeToDb("category"),
      categoryId: scope.categoryId,
      menuItemId: null,
    };
  }

  return {
    restaurantId,
    scopeType: mapUiFlowLibraryScopeToDb("menu_item"),
    categoryId: null,
    menuItemId: scope.menuItemId,
  };
}

async function assertFlowLibraryScope(
  restaurantId: string,
  scope: FlowLibraryScopeInput,
) {
  if (scope.scopeType === "category") {
    const category = await prisma.menuCategory.findFirst({
      where: { id: scope.categoryId, restaurantId },
      select: { id: true },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return;
  }

  const menuItem = await prisma.menuItem.findFirst({
    where: { id: scope.menuItemId, restaurantId },
    select: { id: true },
  });

  if (!menuItem) {
    throw new Error("Menu item not found");
  }
}

function scopeCreateData(scope: FlowLibraryScopeInput) {
  if (scope.scopeType === "category") {
    return {
      scopeType: mapUiFlowLibraryScopeToDb("category"),
      categoryId: scope.categoryId,
      menuItemId: null,
    };
  }

  return {
    scopeType: mapUiFlowLibraryScopeToDb("menu_item"),
    categoryId: null,
    menuItemId: scope.menuItemId,
  };
}

function mapPurchaseFlow(flow: {
  id: string;
  menuItemId: string;
  version: number;
  isActive: boolean;
  steps: Prisma.JsonValue;
}): ProductPurchaseFlowRecord {
  return {
    id: flow.id,
    menuItemId: flow.menuItemId,
    version: flow.version,
    isActive: flow.isActive,
    steps: parseFlowSteps(flow.steps),
  };
}

export async function listProductFlowBlocks(
  restaurantId: string,
  scope?: FlowLibraryScopeInput,
): Promise<ProductFlowBlockRecord[]> {
  const blocks = await prisma.productFlowBlock.findMany({
    where: scopeWhere(restaurantId, scope),
    orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
  });

  return blocks.map(mapFlowBlock);
}

export async function createProductFlowBlock(
  restaurantId: string,
  input: {
    key: string;
    type: ProductFlowBlockRecord["type"];
    config: FlowBlockConfig;
  } & FlowLibraryScopeInput,
): Promise<ProductFlowBlockRecord> {
  await assertFlowLibraryScope(restaurantId, input);

  const maxSortOrder = await prisma.productFlowBlock.aggregate({
    where: scopeWhere(restaurantId, input),
    _max: { sortOrder: true },
  });

  const block = await prisma.productFlowBlock.create({
    data: {
      restaurantId,
      ...scopeCreateData(input),
      key: input.key,
      type: mapUiBlockTypeToDb(input.type),
      config: input.config as Prisma.InputJsonValue,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return mapFlowBlock(block);
}

export async function updateProductFlowBlock(
  restaurantId: string,
  blockId: string,
  input: {
    key?: string;
    type?: ProductFlowBlockRecord["type"];
    config?: FlowBlockConfig;
    isActive?: boolean;
    scopeType?: FlowLibraryScopeInput["scopeType"];
    categoryId?: string;
    menuItemId?: string;
  },
): Promise<ProductFlowBlockRecord> {
  const existing = await prisma.productFlowBlock.findFirst({
    where: { id: blockId, restaurantId },
  });

  if (!existing) {
    throw new Error("Flow block not found");
  }

  const nextScope: FlowLibraryScopeInput =
    input.scopeType === "menu_item"
      ? { scopeType: "menu_item", menuItemId: input.menuItemId ?? "" }
      : input.scopeType === "category"
        ? { scopeType: "category", categoryId: input.categoryId ?? "" }
        : existing.menuItemId
          ? { scopeType: "menu_item", menuItemId: existing.menuItemId }
          : {
              scopeType: "category",
              categoryId: existing.categoryId ?? "",
            };

  if (
    input.scopeType !== undefined ||
    input.categoryId !== undefined ||
    input.menuItemId !== undefined
  ) {
    await assertFlowLibraryScope(restaurantId, nextScope);
  }

  const block = await prisma.productFlowBlock.update({
    where: { id: blockId },
    data: {
      ...(input.key !== undefined ? { key: input.key } : {}),
      ...(input.type !== undefined
        ? { type: mapUiBlockTypeToDb(input.type) }
        : {}),
      ...(input.config !== undefined
        ? { config: input.config as Prisma.InputJsonValue }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.scopeType !== undefined ||
      input.categoryId !== undefined ||
      input.menuItemId !== undefined
        ? scopeCreateData(nextScope)
        : {}),
    },
  });

  return mapFlowBlock(block);
}

export async function deleteProductFlowBlock(
  restaurantId: string,
  blockId: string,
): Promise<boolean> {
  const existing = await prisma.productFlowBlock.findFirst({
    where: { id: blockId, restaurantId },
  });

  if (!existing) {
    throw new Error("Flow block not found");
  }

  await prisma.productFlowBlock.delete({
    where: { id: blockId },
  });

  return true;
}

export async function listProductFlowTemplates(
  restaurantId: string,
  scope?: FlowLibraryScopeInput,
): Promise<ProductFlowTemplateRecord[]> {
  const templates = await prisma.productFlowTemplate.findMany({
    where: scopeWhere(restaurantId, scope),
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return templates.map(mapFlowTemplate);
}

export async function createProductFlowTemplate(
  restaurantId: string,
  input: {
    name: string;
    description?: string;
    steps: FlowStep[];
  } & FlowLibraryScopeInput,
): Promise<ProductFlowTemplateRecord> {
  await assertFlowLibraryScope(restaurantId, input);

  const maxSortOrder = await prisma.productFlowTemplate.aggregate({
    where: scopeWhere(restaurantId, input),
    _max: { sortOrder: true },
  });

  const template = await prisma.productFlowTemplate.create({
    data: {
      restaurantId,
      ...scopeCreateData(input),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      steps: input.steps as Prisma.InputJsonValue,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return mapFlowTemplate(template);
}

export async function updateProductFlowTemplate(
  restaurantId: string,
  templateId: string,
  input: {
    name?: string;
    description?: string | null;
    steps?: FlowStep[];
    isActive?: boolean;
    scopeType?: FlowLibraryScopeInput["scopeType"];
    categoryId?: string;
    menuItemId?: string;
  },
): Promise<ProductFlowTemplateRecord> {
  const existing = await prisma.productFlowTemplate.findFirst({
    where: { id: templateId, restaurantId },
  });

  if (!existing) {
    throw new Error("Flow template not found");
  }

  const nextScope: FlowLibraryScopeInput =
    input.scopeType === "menu_item"
      ? { scopeType: "menu_item", menuItemId: input.menuItemId ?? "" }
      : input.scopeType === "category"
        ? { scopeType: "category", categoryId: input.categoryId ?? "" }
        : existing.menuItemId
          ? { scopeType: "menu_item", menuItemId: existing.menuItemId }
          : {
              scopeType: "category",
              categoryId: existing.categoryId ?? "",
            };

  if (
    input.scopeType !== undefined ||
    input.categoryId !== undefined ||
    input.menuItemId !== undefined
  ) {
    await assertFlowLibraryScope(restaurantId, nextScope);
  }

  const template = await prisma.productFlowTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.steps !== undefined
        ? { steps: input.steps as Prisma.InputJsonValue }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.scopeType !== undefined ||
      input.categoryId !== undefined ||
      input.menuItemId !== undefined
        ? scopeCreateData(nextScope)
        : {}),
    },
  });

  return mapFlowTemplate(template);
}

export async function deleteProductFlowTemplate(
  restaurantId: string,
  templateId: string,
): Promise<boolean> {
  const existing = await prisma.productFlowTemplate.findFirst({
    where: { id: templateId, restaurantId },
  });

  if (!existing) {
    throw new Error("Flow template not found");
  }

  await prisma.productFlowTemplate.delete({
    where: { id: templateId },
  });

  return true;
}

export async function getProductPurchaseFlow(
  restaurantId: string,
  menuItemId: string,
): Promise<ProductPurchaseFlowRecord | null> {
  const flow = await prisma.productPurchaseFlow.findFirst({
    where: { restaurantId, menuItemId },
  });

  return flow ? mapPurchaseFlow(flow) : null;
}

export async function listActiveProductPurchaseFlows(
  restaurantId: string,
): Promise<ProductPurchaseFlowRecord[]> {
  const flows = await prisma.productPurchaseFlow.findMany({
    where: { restaurantId, isActive: true },
  });

  return flows.map(mapPurchaseFlow);
}

export async function listProductPurchaseFlows(
  restaurantId: string,
): Promise<ProductPurchaseFlowRecord[]> {
  const flows = await prisma.productPurchaseFlow.findMany({
    where: { restaurantId },
  });

  return flows.map(mapPurchaseFlow);
}

export async function upsertProductPurchaseFlow(
  restaurantId: string,
  menuItemId: string,
  input: {
    isActive: boolean;
    steps: FlowStep[];
  },
): Promise<ProductPurchaseFlowRecord> {
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
  });

  if (!menuItem) {
    throw new Error("Menu item not found");
  }

  const existing = await prisma.productPurchaseFlow.findUnique({
    where: { menuItemId },
  });

  if (!existing) {
    const flow = await prisma.productPurchaseFlow.create({
      data: {
        restaurantId,
        menuItemId,
        isActive: input.isActive,
        steps: input.steps as Prisma.InputJsonValue,
      },
    });

    return mapPurchaseFlow(flow);
  }

  const flow = await prisma.productPurchaseFlow.update({
    where: { menuItemId },
    data: {
      isActive: input.isActive,
      steps: input.steps as Prisma.InputJsonValue,
      version: existing.version + 1,
    },
  });

  return mapPurchaseFlow(flow);
}

export async function deleteProductPurchaseFlow(
  restaurantId: string,
  menuItemId: string,
): Promise<boolean> {
  const existing = await prisma.productPurchaseFlow.findFirst({
    where: { menuItemId, restaurantId },
  });

  if (!existing) {
    return true;
  }

  await prisma.productPurchaseFlow.delete({
    where: { menuItemId },
  });

  return true;
}

export async function listMenuItemsWithPurchaseFlows(restaurantId: string) {
  const [items, blocks, flows] = await Promise.all([
    prisma.menuItem.findMany({
      where: { restaurantId, isAvailable: true },
      include: {
        category: { select: { name: true } },
        purchaseFlow: true,
      },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { category: { name: "asc" } },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }),
    listProductFlowBlocks(restaurantId),
    listActiveProductPurchaseFlows(restaurantId),
  ]);

  const flowsByMenuItemId = new Map(
    flows.map((flow) => [flow.menuItemId, flow]),
  );

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    categoryName: item.category.name,
    images: item.images,
    purchaseFlow:
      flowsByMenuItemId.get(item.id) ??
      (item.purchaseFlow ? mapPurchaseFlow(item.purchaseFlow) : null),
    flowBlocks: filterFlowBlocksForMenuItem(
      blocks,
      item.id,
      item.categoryId,
    ),
  }));
}
