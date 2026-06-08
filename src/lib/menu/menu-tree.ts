import type { MenuCategoryRecord, MenuItemRecord } from "@/lib/menu/types";
import { menuTagMatchesQuery } from "@/lib/menu/tag-utils";

export type MenuTreeNodeType = "category" | "item" | "category-drop";

export type MenuTreeDragData = {
  type: MenuTreeNodeType;
  categoryId?: string;
};

export function categoryNodeId(categoryId: string) {
  return `category:${categoryId}` as const;
}

export function itemNodeId(itemId: string) {
  return `item:${itemId}` as const;
}

export function categoryDropId(categoryId: string) {
  return `drop:${categoryId}` as const;
}

export function parseMenuTreeNodeId(
  nodeId: string | number,
): { type: MenuTreeNodeType; id: string } | null {
  const value = String(nodeId);

  if (value.startsWith("category:")) {
    return { type: "category", id: value.replace("category:", "") };
  }

  if (value.startsWith("item:")) {
    return { type: "item", id: value.replace("item:", "") };
  }

  if (value.startsWith("drop:")) {
    return { type: "category-drop", id: value.replace("drop:", "") };
  }

  return null;
}

export type MenuTreeLayout = {
  categories: MenuCategoryRecord[];
  itemsByCategory: Record<string, MenuItemRecord[]>;
};

export function buildMenuTreeLayout(
  categories: MenuCategoryRecord[],
  items: MenuItemRecord[],
): MenuTreeLayout {
  const sortedCategories = [...categories].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.name.localeCompare(right.name, undefined, { numeric: true });
  });

  const itemsByCategory = Object.fromEntries(
    sortedCategories.map((category) => [category.id, [] as MenuItemRecord[]]),
  ) as Record<string, MenuItemRecord[]>;

  for (const item of items) {
    if (!itemsByCategory[item.categoryId]) {
      itemsByCategory[item.categoryId] = [];
    }

    itemsByCategory[item.categoryId]!.push(item);
  }

  for (const category of sortedCategories) {
    itemsByCategory[category.id] = [...(itemsByCategory[category.id] ?? [])].sort(
      (left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name, undefined, { numeric: true });
      },
    );
  }

  return {
    categories: sortedCategories,
    itemsByCategory,
  };
}

export function flattenMenuTreeLayout(layout: MenuTreeLayout) {
  const categories = layout.categories.map((category, index) => ({
    id: category.id,
    sortOrder: index,
  }));

  const items = layout.categories.flatMap((category) =>
    (layout.itemsByCategory[category.id] ?? []).map((item, index) => ({
      id: item.id,
      categoryId: category.id,
      sortOrder: index,
    })),
  );

  return { categories, items };
}

export function flattenMenuRecords(
  categories: MenuCategoryRecord[],
  items: MenuItemRecord[],
) {
  return flattenMenuTreeLayout(buildMenuTreeLayout(categories, items));
}

export function applyMenuTreeMove(
  layout: MenuTreeLayout,
  activeId: string,
  overId: string,
): MenuTreeLayout | null {
  const active = parseMenuTreeNodeId(activeId);
  const over = parseMenuTreeNodeId(overId);

  if (!active || !over) {
    return null;
  }

  if (active.type === "category" && over.type === "category") {
    const activeIndex = layout.categories.findIndex(
      (category) => category.id === active.id,
    );
    const overIndex = layout.categories.findIndex(
      (category) => category.id === over.id,
    );

    if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
      return null;
    }

    const categories = [...layout.categories];
    const [moved] = categories.splice(activeIndex, 1);
    categories.splice(overIndex, 0, moved!);

    return { ...layout, categories };
  }

  if (active.type !== "item") {
    return null;
  }

  const sourceCategoryId = findItemCategoryId(layout, active.id);
  if (!sourceCategoryId) {
    return null;
  }

  const sourceItems = [...(layout.itemsByCategory[sourceCategoryId] ?? [])];
  const activeIndex = sourceItems.findIndex((item) => item.id === active.id);

  if (activeIndex === -1) {
    return null;
  }

  const [movedItem] = sourceItems.splice(activeIndex, 1);
  if (!movedItem) {
    return null;
  }

  const nextItemsByCategory = {
    ...layout.itemsByCategory,
    [sourceCategoryId]: sourceItems,
  };

  if (over.type === "category" || over.type === "category-drop") {
    const targetItems = [...(nextItemsByCategory[over.id] ?? []), movedItem];
    nextItemsByCategory[over.id] = targetItems;

    return {
      ...layout,
      itemsByCategory: nextItemsByCategory,
    };
  }

  const targetCategoryId = findItemCategoryId(layout, over.id);
  if (!targetCategoryId) {
    return null;
  }

  const targetItems = [...(nextItemsByCategory[targetCategoryId] ?? [])];
  const overIndex = targetItems.findIndex((item) => item.id === over.id);

  if (overIndex === -1) {
    return null;
  }

  targetItems.splice(overIndex, 0, movedItem);
  nextItemsByCategory[targetCategoryId] = targetItems;

  return {
    ...layout,
    itemsByCategory: nextItemsByCategory,
  };
}

function findItemCategoryId(layout: MenuTreeLayout, itemId: string) {
  for (const category of layout.categories) {
    if ((layout.itemsByCategory[category.id] ?? []).some((item) => item.id === itemId)) {
      return category.id;
    }
  }

  return null;
}

export function layoutToMenuRecords(layout: MenuTreeLayout) {
  const categories = layout.categories.map((category, index) => ({
    ...category,
    sortOrder: index,
  }));

  const items = categories.flatMap((category) =>
    (layout.itemsByCategory[category.id] ?? []).map((item, index) => ({
      ...item,
      categoryId: category.id,
      categoryName: category.name,
      sortOrder: index,
    })),
  );

  return { categories, items };
}

export function filterMenuTreeLayout(
  layout: MenuTreeLayout,
  query: string,
  showUnavailable: boolean,
  catalogLabels: Record<string, string> = {},
  customLabels: Record<string, string> = {},
): MenuTreeLayout {
  const normalizedQuery = query.trim().toLowerCase();

  const categories = layout.categories
    .map((category) => {
      const items = (layout.itemsByCategory[category.id] ?? []).filter((item) => {
        if (!showUnavailable && !item.isAvailable) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(normalizedQuery) ||
          item.description?.toLowerCase().includes(normalizedQuery) ||
          item.tags.some((tag) =>
            menuTagMatchesQuery(tag, normalizedQuery, catalogLabels, customLabels),
          ) ||
          category.name.toLowerCase().includes(normalizedQuery)
        );
      });

      if (items.length === 0 && normalizedQuery) {
        const categoryMatches = category.name.toLowerCase().includes(normalizedQuery);
        if (!categoryMatches) {
          return null;
        }
      }

      return {
        category,
        items,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return {
    categories: categories.map((entry) => entry.category),
    itemsByCategory: Object.fromEntries(
      categories.map((entry) => [entry.category.id, entry.items]),
    ),
  };
}
