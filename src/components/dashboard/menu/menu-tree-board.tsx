"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FolderTree,
  GripVertical,
  ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { reorderMenuLayoutAction } from "@/app/actions/menu";
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
  onEditCategory: (category: MenuCategoryRecord) => void;
  onEditItem: (item: MenuItemRecord) => void;
  onDeleteItem: (item: MenuItemRecord) => void;
  onLayoutChange: (categories: MenuCategoryRecord[], items: MenuItemRecord[]) => void;
};

export function MenuTreeBoard({
  labels,
  currency,
  restaurantId,
  canEdit,
  categories,
  items,
  search,
  showUnavailable,
  tagCatalogLabels,
  onEditCategory,
  onEditItem,
  onDeleteItem,
  onLayoutChange,
}: MenuTreeBoardProps) {
  const [layout, setLayout] = useState<MenuTreeLayout>(() =>
    buildMenuTreeLayout(categories, items),
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const layoutRef = useRef(layout);
  const layoutSnapshotRef = useRef<MenuTreeLayout | null>(null);

  layoutRef.current = layout;

  const isFiltered = search.trim().length > 0 || !showUnavailable;
  const dragEnabled = canEdit && !isFiltered && !isSaving;

  useEffect(() => {
    setLayout(buildMenuTreeLayout(categories, items));
  }, [categories, items]);

  const displayLayout = useMemo(
    () => filterMenuTreeLayout(layout, search, showUnavailable, tagCatalogLabels),
    [layout, search, showUnavailable, tagCatalogLabels],
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
      ? layout.categories.find((category) => category.id === activeNode.id) ?? null
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
    } catch {
      const snapshot = layoutSnapshotRef.current;
      if (snapshot) {
        setLayout(snapshot);
        layoutRef.current = snapshot;
      }
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

    setLayout((current) => {
      const nextLayout =
        applyMenuTreeMove(current, String(active.id), String(over.id)) ?? current;

      layoutRef.current = nextLayout;
      return nextLayout;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!dragEnabled) {
      layoutSnapshotRef.current = null;
      return;
    }

    if (!over) {
      const snapshot = layoutSnapshotRef.current;
      if (snapshot) {
        setLayout(snapshot);
        layoutRef.current = snapshot;
      }
      layoutSnapshotRef.current = null;
      return;
    }

    const activeParsed = parseMenuTreeNodeId(active.id);
    let nextLayout = layoutRef.current;

    if (activeParsed?.type === "category") {
      nextLayout =
        applyMenuTreeMove(nextLayout, String(active.id), String(over.id)) ??
        nextLayout;
      setLayout(nextLayout);
      layoutRef.current = nextLayout;
    }

    void persistLayout(nextLayout);
  }

  function handleDragCancel() {
    setActiveId(null);
    const snapshot = layoutSnapshotRef.current;
    if (snapshot) {
      setLayout(snapshot);
      layoutRef.current = snapshot;
    }
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

      {dragEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {treeBody}
          <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
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
  onEditCategory: () => void;
  onEditItem: (item: MenuItemRecord) => void;
  onDeleteItem: (item: MenuItemRecord) => void;
}) {
  const sortable = useSortable({
    id: categoryNodeId(category.id),
    disabled: !dragEnabled,
    data: { type: "category" },
  });

  const dropZone = useDroppable({
    id: categoryDropId(category.id),
    disabled: !dragEnabled,
    data: { type: "category-drop", categoryId: category.id },
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  return (
    <section
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "rounded-3xl border border-border bg-card shadow-sm",
        sortable.isDragging && "opacity-50",
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        {dragEnabled ? (
          <button
            type="button"
            className="touch-none rounded-lg p-1 text-muted-foreground hover:bg-muted"
            aria-label={labels.tree.dragCategory}
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : null}
        <FolderTree className="size-4 text-primary" aria-hidden />
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
            <Pencil className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>

      <div
        ref={dropZone.setNodeRef}
        className={cn(
          "space-y-2 p-3 pl-5 md:pl-8",
          dropZone.isOver && "bg-primary/5",
        )}
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
              onEdit={() => onEditItem(item)}
              onDelete={() => onDeleteItem(item)}
            />
          ))}
        </SortableContext>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            {labels.tree.emptyCategory}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MenuTreeItemRow({
  item,
  labels,
  currency,
  canEdit,
  dragEnabled,
  tagCatalogLabels,
  onEdit,
  onDelete,
}: {
  item: MenuItemRecord;
  labels: MenuPageLabels;
  currency: string;
  canEdit: boolean;
  dragEnabled: boolean;
  tagCatalogLabels: Record<string, string>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sortable = useSortable({
    id: itemNodeId(item.id),
    disabled: !dragEnabled,
    data: { type: "item", categoryId: item.categoryId },
  });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2.5",
        sortable.isDragging && "opacity-50",
      )}
    >
      {dragEnabled ? (
        <button
          type="button"
          className="touch-none rounded-lg p-1 text-muted-foreground hover:bg-muted"
          aria-label={labels.tree.dragItem}
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      ) : null}

      <MenuItemThumbnail name={item.name} imageUrl={item.images[0]} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{item.name}</p>
          {!item.isAvailable ? (
            <Badge variant="secondary">{labels.item.unavailable}</Badge>
          ) : null}
        </div>
        {item.description ? (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        ) : null}
        <MenuItemTagsPreview
          tags={item.tags}
          catalogLabels={tagCatalogLabels}
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
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onDelete}
            aria-label={labels.actions.delete}
          >
            <Trash2 className="size-4" aria-hidden />
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
    <div className="flex min-w-[260px] items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 shadow-lg">
      <FolderTree className="size-4 text-primary" aria-hidden />
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
  return (
    <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-lg">
      <MenuItemThumbnail name={item.name} imageUrl={item.images[0]} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        {!item.isAvailable ? (
          <p className="text-xs text-muted-foreground">{labels.item.unavailable}</p>
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
      <img
        src={imageUrl}
        alt={name}
        className="size-10 shrink-0 rounded-xl object-cover"
      />
    );
  }

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <ImageIcon className="size-4" aria-hidden />
    </div>
  );
}
