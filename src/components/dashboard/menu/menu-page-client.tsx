"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMenuItemAction } from "@/app/actions/menu";
import { ListPagination } from "@/components/dashboard/list-pagination";
import type { Locale } from "@/i18n/locales";
import { defaultLocale } from "@/i18n/locales";
import { buildListUrl } from "@/lib/list-url";
import {
  hasMenuContentFilters,
  parseMenuListSearchParams,
} from "@/lib/menu/filters";
import {
  buildMenuCustomTagLabelMap,
  type MenuCustomTagRecord,
} from "@/lib/menu/custom-tags.shared";
import { collectMenuTagSuggestions } from "@/lib/menu/tag-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MenuCategoryRecord, MenuItemRecord } from "@/lib/menu/types";
import { MenuCategoryDialog } from "./menu-category-dialog";
import { MenuFilters } from "./menu-filters";
import { MenuHeader } from "./menu-header";
import { FlowBlocksLibraryDialog } from "./flow-blocks-library-dialog";
import { MenuItemDialog } from "./menu-item-dialog";
import { ContentLocalesDialog } from "./content-locales-dialog";
import { DebouncedSearchDraft } from "@/components/dashboard/url-synced-draft";
import { MenuTreeBoard } from "./menu-tree-board";
import type { MenuPageClientProps } from "./types";
import type { MenuListFilters } from "@/lib/menu/filters";
import type {
  ProductFlowBlockRecord,
  ProductFlowTemplateRecord,
} from "@/lib/product-flow/types";

function buildMenuServerSnapshotKey({
  items,
  categories,
  customTagDefinitions,
  flowBlocks,
  flowTemplates,
  productFlowsByMenuItemId,
}: Pick<
  MenuPageClientProps,
  | "items"
  | "categories"
  | "customTagDefinitions"
  | "flowBlocks"
  | "flowTemplates"
  | "productFlowsByMenuItemId"
>) {
  return [
    items
      .map(
        (item) =>
          `${item.id}:${item.priceCents}:${item.isAvailable}:${item.categoryId}`,
      )
      .join("|"),
    categories
      .map(
        (category) =>
          `${category.id}:${category.name}:${category.itemCount}`,
      )
      .join("|"),
    customTagDefinitions.map((tag) => tag.key).join("|"),
    flowBlocks.map((block) => block.id).join("|"),
    flowTemplates.map((template) => template.id).join("|"),
    Object.keys(productFlowsByMenuItemId).sort().join("|"),
  ].join("::");
}

export function MenuPageClient(props: MenuPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => parseMenuListSearchParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );
  const urlSearch = filters.search ?? "";
  const {
    items: snapshotItems,
    categories: snapshotCategories,
    customTagDefinitions: snapshotCustomTags,
    flowBlocks: snapshotFlowBlocks,
    flowTemplates: snapshotFlowTemplates,
    productFlowsByMenuItemId: snapshotProductFlows,
  } = props;
  const serverSnapshotKey = useMemo(
    () =>
      buildMenuServerSnapshotKey({
        items: snapshotItems,
        categories: snapshotCategories,
        customTagDefinitions: snapshotCustomTags,
        flowBlocks: snapshotFlowBlocks,
        flowTemplates: snapshotFlowTemplates,
        productFlowsByMenuItemId: snapshotProductFlows,
      }),
    [
      snapshotItems,
      snapshotCategories,
      snapshotCustomTags,
      snapshotFlowBlocks,
      snapshotFlowTemplates,
      snapshotProductFlows,
    ],
  );

  const navigateFilters = useCallback(
    (
      next: {
        search?: string;
        categoryId?: string;
        showUnavailable?: boolean;
      },
      options?: { page?: number },
    ) => {
      const nextCategoryId = next.categoryId ?? filters.categoryId;

      router.push(
        buildListUrl(
          "/dashboard/menu",
          {
            search: next.search ?? filters.search,
            category:
              nextCategoryId && nextCategoryId !== "all"
                ? nextCategoryId
                : undefined,
            showUnavailable:
              (next.showUnavailable ?? filters.showUnavailable) === false
                ? "false"
                : undefined,
          },
          {
            page: options?.page ?? 1,
            pageSize: filters.pageSize,
          },
        ),
      );
    },
    [filters, router],
  );

  return (
    <DebouncedSearchDraft
      key={urlSearch}
      urlSearch={urlSearch}
      onDebouncedChange={(search) => navigateFilters({ search })}
    >
      {(searchDraft, setSearchDraft) => (
        <MenuPageClientBody
          key={serverSnapshotKey}
          {...props}
          filters={filters}
          searchDraft={searchDraft}
          setSearchDraft={setSearchDraft}
          navigateFilters={navigateFilters}
        />
      )}
    </DebouncedSearchDraft>
  );
}

function MenuPageClientBody({
  labels,
  restaurantId,
  currency,
  canEdit,
  items: initialItems,
  categories: initialCategories,
  pagination: initialPagination,
  catalogTags,
  tagCatalogLabels,
  customTagDefinitions: initialCustomTagDefinitions,
  localeOptions,
  flowBlocks: initialFlowBlocks,
  flowTemplates: initialFlowTemplates,
  productFlowsByMenuItemId: initialProductFlowsByMenuItemId,
  contentLocales: initialContentLocales,
  filters,
  searchDraft,
  setSearchDraft,
  navigateFilters,
}: MenuPageClientProps & {
  filters: MenuListFilters;
  searchDraft: string;
  setSearchDraft: (value: string) => void;
  navigateFilters: (
    next: {
      search?: string;
      categoryId?: string;
      showUnavailable?: boolean;
    },
    options?: { page?: number },
  ) => void;
}) {
  const locale = useLocale();
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  const [contentLocales, setContentLocales] = useState(initialContentLocales);
  const [localeOptionsState, setLocaleOptionsState] = useState(localeOptions);
  const [items, setItems] = useState(initialItems);
  const [categories, setCategories] = useState(initialCategories);
  const [customTagDefinitions, setCustomTagDefinitions] = useState(
    initialCustomTagDefinitions,
  );
  const [activeItem, setActiveItem] = useState<MenuItemRecord | null>(null);
  const [activeCategory, setActiveCategory] =
    useState<MenuCategoryRecord | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [flowLibraryOpen, setFlowLibraryOpen] = useState(false);
  const [contentLocalesOpen, setContentLocalesOpen] = useState(false);
  const [flowBlocks, setFlowBlocks] =
    useState<ProductFlowBlockRecord[]>(initialFlowBlocks);
  const [flowTemplates, setFlowTemplates] =
    useState<ProductFlowTemplateRecord[]>(initialFlowTemplates);
  const [productFlowsByMenuItemId, setProductFlowsByMenuItemId] = useState(
    initialProductFlowsByMenuItemId,
  );

  const customTagLabels = useMemo(
    () =>
      buildMenuCustomTagLabelMap(
        customTagDefinitions,
        locale as Locale,
        defaultLocale,
      ),
    [customTagDefinitions, locale],
  );

  const tagSuggestions = useMemo(
    () => collectMenuTagSuggestions(items),
    [items],
  );

  const urlParams = useMemo(
    () => ({
      search: filters.search,
      category: filters.categoryId,
      showUnavailable: filters.showUnavailable === false ? "false" : undefined,
    }),
    [filters],
  );

  const contentFiltersActive = hasMenuContentFilters(filters);

  function handleRefresh() {
    startRefresh(() => {
      router.refresh();
    });
  }

  function handleCreateItem() {
    setActiveItem(null);
    setItemDialogOpen(true);
  }

  function handleEditItem(item: MenuItemRecord) {
    setActiveItem(item);
    setItemDialogOpen(true);
  }

  function handleCreateCategory() {
    setActiveCategory(null);
    setCategoryDialogOpen(true);
  }

  function handleEditCategory(category: MenuCategoryRecord) {
    setActiveCategory(category);
    setCategoryDialogOpen(true);
  }

  function upsertItem(
    nextItem: MenuItemRecord,
    nextCustomTagDefinitions?: MenuCustomTagRecord[],
  ) {
    if (nextCustomTagDefinitions) {
      setCustomTagDefinitions(nextCustomTagDefinitions);
    }

    setItems((current) => {
      const exists = current.some((item) => item.id === nextItem.id);
      const nextItems = exists
        ? current.map((item) => (item.id === nextItem.id ? nextItem : item))
        : [...current, nextItem];

      setCategories((cats) =>
        cats.map((category) => ({
          ...category,
          itemCount: nextItems.filter((item) => item.categoryId === category.id)
            .length,
        })),
      );

      return nextItems;
    });
  }

  function handleCategoryCreated(category: MenuCategoryRecord) {
    setCategories((current) => [...current, category]);
  }

  function handleCategoryUpdated(category: MenuCategoryRecord) {
    setCategories((current) =>
      current.map((entry) => (entry.id === category.id ? category : entry)),
    );
    setItems((current) =>
      current.map((item) =>
        item.categoryId === category.id
          ? { ...item, categoryName: category.name }
          : item,
      ),
    );
  }

  function handleCategoryDeleted(categoryId: string) {
    setCategories((current) =>
      current.filter((entry) => entry.id !== categoryId),
    );
    setItems((current) =>
      current.filter((item) => item.categoryId !== categoryId),
    );
  }

  async function handleDeleteItem(item: MenuItemRecord) {
    if (!window.confirm(labels.itemDialog.confirmDelete)) {
      return;
    }

    try {
      await deleteMenuItemAction({
        restaurantId,
        menuItemId: item.id,
      });
      setItems((current) => {
        const nextItems = current.filter((entry) => entry.id !== item.id);
        setCategories((cats) =>
          cats.map((category) => ({
            ...category,
            itemCount: nextItems.filter(
              (entry) => entry.categoryId === category.id,
            ).length,
          })),
        );
        return nextItems;
      });
      toast.success(labels.itemDialog.successDelete);
    } catch {
      toast.error(labels.feedback.error);
    }
  }

  function handleLayoutChange(
    nextCategories: MenuCategoryRecord[],
    nextItems: MenuItemRecord[],
  ) {
    setCategories(nextCategories);
    setItems(nextItems);
  }

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <MenuHeader
        labels={labels}
        canEdit={canEdit}
        onNewItem={handleCreateItem}
        onNewCategory={handleCreateCategory}
        onOpenContentLocales={() => setContentLocalesOpen(true)}
        onOpenFlowLibrary={() => setFlowLibraryOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <MenuFilters
        labels={labels}
        categories={categories}
        search={searchDraft}
        categoryId={filters.categoryId ?? "all"}
        showUnavailable={filters.showUnavailable ?? true}
        onSearchChange={setSearchDraft}
        onCategoryChange={(categoryId) => navigateFilters({ categoryId })}
        onShowUnavailableChange={(showUnavailable) =>
          navigateFilters({ showUnavailable })
        }
        onClear={() => {
          setSearchDraft("");
          navigateFilters({
            search: "",
            categoryId: "all",
            showUnavailable: true,
          });
        }}
      />

      {categories.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.empty.title}</CardTitle>
            <CardDescription>{labels.empty.description}</CardDescription>
          </CardHeader>
          {canEdit ? (
            <CardContent>
              <Button className="rounded-2xl" onClick={handleCreateCategory}>
                {labels.empty.categoryCta}
              </Button>
            </CardContent>
          ) : null}
        </Card>
      ) : (
        <div className="space-y-4">
          <MenuTreeBoard
            labels={labels}
            currency={currency}
            restaurantId={restaurantId}
            canEdit={canEdit}
            categories={categories}
            items={items}
            search={searchDraft}
            showUnavailable={filters.showUnavailable ?? true}
            tagCatalogLabels={tagCatalogLabels}
            customTagLabels={customTagLabels}
            onEditCategory={handleEditCategory}
            onEditItem={handleEditItem}
            onDeleteItem={(item) => void handleDeleteItem(item)}
            onLayoutChange={handleLayoutChange}
          />
          {!contentFiltersActive ? (
            <ListPagination
              basePath="/dashboard/menu"
              params={urlParams}
              meta={initialPagination}
              labels={labels.pagination}
            />
          ) : null}
        </div>
      )}

      {canEdit ? (
        <>
          <MenuItemDialog
            labels={labels}
            currency={currency}
            restaurantId={restaurantId}
            categories={categories}
            item={activeItem}
            catalogTags={catalogTags}
            tagCatalogLabels={tagCatalogLabels}
            customTagDefinitions={customTagDefinitions}
            localeOptions={localeOptionsState}
            flowLabels={labels.flow}
            flowBlocks={flowBlocks}
            flowTemplates={flowTemplates}
            productFlowsByMenuItemId={productFlowsByMenuItemId}
            allMenuItems={items.map((entry) => ({
              id: entry.id,
              name: entry.name,
              priceCents: entry.priceCents,
            }))}
            tagSuggestions={tagSuggestions}
            open={itemDialogOpen}
            onOpenChange={setItemDialogOpen}
            onSuccess={upsertItem}
            onFlowTemplateCreated={(template) =>
              setFlowTemplates((current) => [...current, template])
            }
            onFlowSaved={(menuItemId, flow) =>
              setProductFlowsByMenuItemId((current) => {
                const next = { ...current };
                if (flow) {
                  next[menuItemId] = flow;
                } else {
                  delete next[menuItemId];
                }
                return next;
              })
            }
          />
          <FlowBlocksLibraryDialog
            open={flowLibraryOpen}
            onOpenChange={setFlowLibraryOpen}
            labels={labels.flow}
            localeOptions={localeOptionsState}
            currency={currency}
            restaurantId={restaurantId}
            blocks={flowBlocks}
            templates={flowTemplates}
            categories={categories.map((entry) => ({
              id: entry.id,
              name: entry.name,
            }))}
            menuItems={items.map((entry) => ({
              id: entry.id,
              name: entry.name,
            }))}
            onBlocksChange={setFlowBlocks}
            onTemplatesChange={setFlowTemplates}
          />
          <ContentLocalesDialog
            open={contentLocalesOpen}
            onOpenChange={setContentLocalesOpen}
            labels={labels.flow.contentLocales}
            uiLocale={locale}
            restaurantId={restaurantId}
            contentLocales={contentLocales}
            onSaved={(nextLocales, nextLocaleOptions) => {
              setContentLocales(nextLocales);
              setLocaleOptionsState(nextLocaleOptions);
            }}
          />
          <MenuCategoryDialog
            labels={labels}
            restaurantId={restaurantId}
            category={activeCategory}
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
            onCreated={handleCategoryCreated}
            onUpdated={handleCategoryUpdated}
            onDeleted={handleCategoryDeleted}
          />
        </>
      ) : null}
    </main>
  );
}
