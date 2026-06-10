"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TbFolderRoot,
  TbGripVertical,
  TbPhoto,
  TbPencil,
  TbTrash,
} from "react-icons/tb";
import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { reorderMenuLayoutAction } from "@/app/actions/menu";
import { defaultLocale } from "@/i18n/locales";
import {
  resolveMenuItemDescription,
  resolveMenuItemName,
} from "@/lib/menu/item-translations";
import { formatCurrency } from "@/lib/orders/currency";
import type { MenuCategoryRecord, MenuItemRecord } from "@/lib/menu/types";
import {
  applyMenuTreeMove,
  buildMenuTreeLayout,
  categoryDropId,
  categoryNodeId,
  filterMenuTreeLayout,
  flattenMenuTreeLayout,
  itemNodeId,
  layoutToMenuRecords,
  parseMenuTreeNodeId,
  type MenuTreeLayout,
} from "@/lib/menu/menu-tree";
import { Badge } from "@/components/ui/badge";
import { MenuItemTagsPreview } from "./menu-item-tags-field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MenuPageLabels } from "./types";

type MenuTreeBoardProps = {
  labels: MenuPageLabels;
  currency: string;
  restaurantId: string;
  canEdit: boolean;
  categories: MenuCategoryRecord[];
  items: MenuItemRecord[];
  search: string;
  showUnavailable: boolean;
  tagCatalogLabels: Record<string, string>;
  customTagLabels: Record<string, string>;
  onEditCategory: (category: MenuCategoryRecord) => void;
  onEditItem: (item: MenuItemRecord) => void;
  onDeleteItem: (item: MenuItemRecord) => void;
  onLayoutChange: (
    categories: MenuCategoryRecord[],
    items: MenuItemRecord[],
  ) => void;
};

function buildMenuTreeLayoutKey(
  categories: MenuCategoryRecord[],
  items: MenuItemRecord[],
) {
  return (
    categories.map((category) => `${category.id}:${category.sortOrder}`).join("|") +
    ";" +
    items
      .map((item) => `${item.id}:${item.categoryId}:${item.sortOrder}`)
      .join("|")
  );
}

export function MenuTreeBoard(props: MenuTreeBoardProps) {
  const layoutKey = useMemo(
    () => buildMenuTreeLayoutKey(props.categories, props.items),
    [props.categories, props.items],
  );

  return <MenuTreeBoardInner key={layoutKey} {...props} />;
}

function MenuTreeBoardInner({
  labels,
  currency,
  restaurantId,
  canEdit,
  categories,
  items,
  search,
  showUnavailable,
  tagCatalogLabels,
  customTagLabels,
  onEditCategory,
  onEditItem,
  onDeleteItem,
  onLayoutChange,
}: MenuTreeBoardProps) {
  const baseLayout = useMemo(
    () => buildMenuTreeLayout(categories, items),
    [categories, items],
  );
  const [dragLayout, setDragLayoutState] = useState<MenuTreeLayout | null>(
    null,
  );
  const layout = dragLayout ?? baseLayout;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const layoutRef = useRef(layout);
  const layoutSnapshotRef = useRef<MenuTreeLayout | null>(null);

  function setDragLayout(
    next: MenuTreeLayout | ((current: MenuTreeLayout) => MenuTreeLayout),
  ) {
    setDragLayoutState((current) => {
      const resolvedBase = current ?? baseLayout;
      return typeof next === "function" ? next(resolvedBase) : next;
    });
  }

  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const isFiltered = search.trim().length > 0 || !showUnavailable;
  const dndEnabled = canEdit && !isFiltered;
  const dragEnabled = dndEnabled && !isSaving;

  const displayLayout = useMemo(
    () =>
      filterMenuTreeLayout(
        layout,
        search,
        showUnavailable,
        tagCatalogLabels,
        customTagLabels,
      ),
    [layout, search, showUnavailable, tagCatalogLabels, customTagLabels],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeNode = activeId ? parseMenuTreeNodeId(activeId) : null;
  const activeCategory =
    activeNode?.type === "category"
      ? (layout.categories.find((category) => category.id === activeNode.id) ??
        null)
      : null;
  const activeItem = useMemo(() => {
    if (activeNode?.type !== "item") {
      return null;
    }

    for (const categoryItems of Object.values(layout.itemsByCategory)) {
      const found = categoryItems.find((item) => item.id === activeNode.id);
      if (found) {
        return found;
      }
    }

    return null;
  }, [activeNode, layout]);

  async function persistLayout(nextLayout: MenuTreeLayout) {
    const payload = flattenMenuTreeLayout(nextLayout);

    setIsSaving(true);

    try {
      await reorderMenuLayoutAction({
        restaurantId,
        categories: payload.categories,
        items: payload.items,
      });

      const records = layoutToMenuRecords(nextLayout);
      onLayoutChange(records.categories, records.items);
      setDragLayoutState(null);
    } catch {
      const snapshot = layoutSnapshotRef.current;
      setDragLayoutState(snapshot);
      toast.error(labels.feedback.error);
    } finally {
      setIsSaving(false);
      layoutSnapshotRef.current = null;
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (!dragEnabled) {
      return;
    }

    layoutSnapshotRef.current = structuredClone(layoutRef.current);
    setActiveId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    if (!dragEnabled) {
      return;
    }

    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const activeParsed = parseMenuTreeNodeId(active.id);
    if (!activeParsed || activeParsed.type === "category") {
      return;
    }

    setDragLayout(
      (current) =>
        applyMenuTreeMove(current, String(active.id), String(over.id)) ??
        current,
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!dragEnabled) {
      layoutSnapshotRef.current = null;
      return;
    }

    if (!over) {
      setDragLayoutState(null);
      layoutSnapshotRef.current = null;
      return;
    }

    const activeParsed = parseMenuTreeNodeId(active.id);
    let nextLayout = layoutRef.current;

    if (activeParsed) {
      nextLayout =
        applyMenuTreeMove(nextLayout, String(active.id), String(over.id)) ??
        nextLayout;
      setDragLayout(nextLayout);
      void persistLayout(nextLayout);
    }

    layoutSnapshotRef.current = null;
  }

  function handleDragCancel() {
    setActiveId(null);
    setDragLayoutState(null);
    layoutSnapshotRef.current = null;
  }

  const treeBody = (
    <div className="space-y-3">
      {displayLayout.categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {labels.empty.description}
        </div>
      ) : (
        <SortableContext
          items={displayLayout.categories.map((category) =>
            categoryNodeId(category.id),
          )}
          strategy={verticalListSortingStrategy}
        >
          {displayLayout.categories.map((category) => (
            <MenuTreeCategorySection
              key={category.id}
              category={category}
              items={displayLayout.itemsByCategory[category.id] ?? []}
              labels={labels}
              currency={currency}
              canEdit={canEdit}
              dragEnabled={dragEnabled}
              tagCatalogLabels={tagCatalogLabels}
              customTagLabels={customTagLabels}
              onEditCategory={() => onEditCategory(category)}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        {isFiltered ? labels.tree.searchLocked : labels.tree.dragHint}
      </div>

      {dndEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {treeBody}
          <DragOverlay dropAnimation={null} className="cursor-grabbing">
            {activeCategory ? (
              <MenuTreeCategoryPreview
                category={activeCategory}
                itemCount={
                  (layout.itemsByCategory[activeCategory.id] ?? []).length
                }
                labels={labels}
              />
            ) : null}
            {activeItem ? (
              <MenuTreeItemPreview
                item={activeItem}
                currency={currency}
                labels={labels}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        treeBody
      )}
    </div>
  );
}

function MenuTreeCategorySection({
  category,
  items,
  labels,
  currency,
  canEdit,
  dragEnabled,
  tagCatalogLabels,
  customTagLabels,
  onEditCategory,
  onEditItem,
  onDeleteItem,
}: {
  category: MenuCategoryRecord;
  items: MenuItemRecord[];
  labels: MenuPageLabels;
  currency: string;
  canEdit: boolean;
  dragEnabled: boolean;
  tagCatalogLabels: Record<string, string>;
  customTagLabels: Record<string, string>;
  onEditCategory: () => void;
  onEditItem: (item: MenuItemRecord) => void;
  onDeleteItem: (item: MenuItemRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: categoryNodeId(category.id),
      disabled: !dragEnabled,
      data: { type: "category" },
    });

  const style = isDragging
    ? undefined
    : {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
      };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-3xl border border-border bg-card shadow-sm transition-opacity",
        isDragging && "invisible",
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        {dragEnabled ? (
          <button
            type="button"
            className="touch-none rounded-lg p-1 text-muted-foreground hover:bg-muted"
            aria-label={labels.tree.dragCategory}
            {...attributes}
            {...listeners}
          >
            <TbGripVertical className="size-4" aria-hidden />
          </button>
        ) : null}
        <TbFolderRoot className="size-4 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-muted-foreground">
            {labels.item.itemCount.replace("{count}", String(items.length))}
          </p>
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onEditCategory}
            aria-label={labels.actions.edit}
          >
            <TbPencil className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      <MenuTreeCategoryDropZone
        categoryId={category.id}
        dragEnabled={dragEnabled}
        emptyLabel={labels.tree.emptyCategory}
        itemCount={items.length}
      >
        <SortableContext
          items={items.map((item) => itemNodeId(item.id))}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <MenuTreeItemRow
              key={item.id}
              item={item}
              labels={labels}
              currency={currency}
              canEdit={canEdit}
              dragEnabled={dragEnabled}
              tagCatalogLabels={tagCatalogLabels}
              customTagLabels={customTagLabels}
              onEdit={() => onEditItem(item)}
              onDelete={() => onDeleteItem(item)}
            />
          ))}
        </SortableContext>
      </MenuTreeCategoryDropZone>
    </section>
  );
}

function MenuTreeCategoryDropZone({
  categoryId,
  dragEnabled,
  emptyLabel,
  itemCount,
  children,
}: {
  categoryId: string;
  dragEnabled: boolean;
  emptyLabel: string;
  itemCount: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: categoryDropId(categoryId),
    disabled: !dragEnabled || itemCount > 0,
    data: { type: "category-drop", categoryId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn("space-y-2 p-3 pl-5 md:pl-8", isOver && "bg-primary/5")}
    >
      {children}

      {itemCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </div>
      ) : null}
    </div>
  );
}

function MenuTreeItemRow({
  item,
  labels,
  currency,
  canEdit,
  dragEnabled,
  tagCatalogLabels,
  customTagLabels,
  onEdit,
  onDelete,
}: {
  item: MenuItemRecord;
  labels: MenuPageLabels;
  currency: string;
  canEdit: boolean;
  dragEnabled: boolean;
  tagCatalogLabels: Record<string, string>;
  customTagLabels: Record<string, string>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const locale = useLocale();
  const displayName = resolveMenuItemName(item, locale, defaultLocale);
  const displayDescription = resolveMenuItemDescription(
    item,
    locale,
    defaultLocale,
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: itemNodeId(item.id),
      disabled: !dragEnabled,
      data: { type: "item", categoryId: item.categoryId },
    });

  const style = isDragging
    ? undefined
    : {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
      };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5 transition-opacity",
        isDragging && "invisible",
      )}
    >
      {dragEnabled ? (
        <button
          type="button"
          className="touch-none rounded-lg p-1 text-muted-foreground hover:bg-muted"
          aria-label={labels.tree.dragItem}
          {...attributes}
          {...listeners}
        >
          <TbGripVertical className="size-4" aria-hidden />
        </button>
      ) : null}

      <MenuItemThumbnail name={displayName} imageUrl={item.images[0]} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{displayName}</p>
          {!item.isAvailable ? (
            <Badge variant="secondary">{labels.item.unavailable}</Badge>
          ) : null}
        </div>
        {displayDescription ? (
          <p className="truncate text-xs text-muted-foreground">
            {displayDescription}
          </p>
        ) : null}
        <MenuItemTagsPreview
          tags={item.tags}
          catalogLabels={tagCatalogLabels}
          customLabels={customTagLabels}
          className="mt-1.5"
        />
      </div>

      <p className="shrink-0 text-sm font-medium">
        {formatCurrency(item.priceCents, currency)}
      </p>

      {canEdit ? (
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onEdit}
            aria-label={labels.actions.edit}
          >
            <TbPencil className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onDelete}
            aria-label={labels.actions.delete}
          >
            <TbTrash className="size-4" aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function MenuTreeCategoryPreview({
  category,
  itemCount,
  labels,
}: {
  category: MenuCategoryRecord;
  itemCount: number;
  labels: MenuPageLabels;
}) {
  return (
    <div className="flex min-w-[260px] items-center gap-2 rounded-3xl border border-primary/30 bg-card px-4 py-3 shadow-md ring-2 ring-primary/15">
      <TbFolderRoot className="size-4 text-primary" aria-hidden />
      <div>
        <p className="font-medium">{category.name}</p>
        <p className="text-xs text-muted-foreground">
          {labels.item.itemCount.replace("{count}", String(itemCount))}
        </p>
      </div>
    </div>
  );
}

function MenuTreeItemPreview({
  item,
  currency,
  labels,
}: {
  item: MenuItemRecord;
  currency: string;
  labels: MenuPageLabels;
}) {
  const locale = useLocale();
  const displayName = resolveMenuItemName(item, locale, defaultLocale);

  return (
    <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-primary/30 bg-card px-3 py-2.5 shadow-md ring-2 ring-primary/15">
      <MenuItemThumbnail name={displayName} imageUrl={item.images[0]} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{displayName}</p>
        {!item.isAvailable ? (
          <p className="text-xs text-muted-foreground">
            {labels.item.unavailable}
          </p>
        ) : null}
      </div>
      <p className="text-sm font-medium">
        {formatCurrency(item.priceCents, currency)}
      </p>
    </div>
  );
}

function MenuItemThumbnail({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={40}
        height={40}
        unoptimized
        className="size-10 shrink-0 rounded-xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <TbPhoto className="size-4" aria-hidden />
    </div>
  );
}
