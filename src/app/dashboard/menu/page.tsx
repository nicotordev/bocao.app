import { getTranslations } from "next-intl/server";
import { MenuPageClient } from "@/components/dashboard/menu/menu-page-client";
import type { MenuPageLabels } from "@/components/dashboard/menu/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { listMenuCustomTags } from "@/lib/menu/custom-tags";
import {
  listMenuCategories,
  listMenuItemRecords,
} from "@/lib/menu/repository";
import {
  MENU_TAG_CATALOG,
  MENU_TAG_CATALOG_KEYS,
} from "@/lib/menu/tag-types";
import { locales } from "@/i18n/locales";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export default async function MenuPage() {
  const t = await getTranslations("dashboard.menu");
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const currency = context?.activeRestaurant?.currency ?? "CLP";
  const canEdit =
    context?.membership.permissions.includes(PERMISSIONS.MENU_WRITE) ?? false;
  const canRead =
    context?.membership.permissions.includes(PERMISSIONS.MENU_READ) ?? false;

  const [items, categories, customTagDefinitions] = restaurantId
    ? await Promise.all([
        listMenuItemRecords(restaurantId, { availableOnly: false }),
        listMenuCategories(restaurantId),
        listMenuCustomTags(restaurantId),
      ])
    : [[], [], []];

  const localeOptions = locales.map((locale) => ({
    value: locale,
    label: t(`locales.${locale}`),
  }));

  const tagCatalogLabels = Object.fromEntries(
    MENU_TAG_CATALOG_KEYS.map((key) => [key, t(`tags.${key}`)]),
  ) as Record<string, string>;

  const catalogTags = MENU_TAG_CATALOG_KEYS.map((key) => ({
    key,
    label: tagCatalogLabels[key],
    icon: MENU_TAG_CATALOG[key].icon,
  }));

  const labels: MenuPageLabels = {
    header: {
      title: t("header.title"),
      subtitle: t("header.subtitle"),
    },
    actions: {
      newItem: t("actions.newItem"),
      newCategory: t("actions.newCategory"),
      refresh: t("actions.refresh"),
      edit: t("actions.edit"),
      delete: t("actions.delete"),
      cancel: t("actions.cancel"),
      save: t("actions.save"),
      create: t("actions.create"),
      saving: t("actions.saving"),
    },
    filters: {
      search: t("filters.search"),
      searchPlaceholder: t("filters.searchPlaceholder"),
      category: t("filters.category"),
      allCategories: t("filters.allCategories"),
      showUnavailable: t("filters.showUnavailable"),
      clear: t("filters.clear"),
    },
    empty: {
      title: t("empty.title"),
      description: t("empty.description"),
      cta: t("empty.cta"),
      categoryCta: t("empty.categoryCta"),
    },
    item: {
      photos: t("item.photos"),
      unavailable: t("item.unavailable"),
      available: t("item.available"),
      itemCount: t.raw("item.itemCount"),
    },
    photos: {
      addPhoto: t("photos.addPhoto"),
      removePhoto: t("photos.removePhoto"),
      uploading: t("photos.uploading"),
      uploadError: t("photos.uploadError"),
      invalidImageType: t("photos.invalidImageType"),
      imageTooLarge: t("photos.imageTooLarge"),
      storageNotConfigured: t("photos.storageNotConfigured"),
      saveError: t("photos.saveError"),
      saveSuccess: t("photos.saveSuccess"),
    },
    permissions: {
      deniedTitle: t("permissions.deniedTitle"),
      deniedDescription: t("permissions.deniedDescription"),
    },
    itemDialog: {
      createTitle: t("itemDialog.createTitle"),
      editTitle: t("itemDialog.editTitle"),
      createDescription: t("itemDialog.createDescription"),
      editDescription: t("itemDialog.editDescription"),
      name: t("itemDialog.name"),
      namePlaceholder: t("itemDialog.namePlaceholder"),
      description: t("itemDialog.description"),
      descriptionPlaceholder: t("itemDialog.descriptionPlaceholder"),
      price: t("itemDialog.price"),
      category: t("itemDialog.category"),
      categoryPlaceholder: t("itemDialog.categoryPlaceholder"),
      available: t("itemDialog.available"),
      tags: t("itemDialog.tags"),
      tagsCatalog: t("itemDialog.tagsCatalog"),
      tagsCustom: t("itemDialog.tagsCustom"),
      tagsPlaceholder: t("itemDialog.tagsPlaceholder"),
      tagsAdd: t("itemDialog.tagsAdd"),
      tagsRemove: t("itemDialog.tagsRemove"),
      tagsSuggestions: t("itemDialog.tagsSuggestions"),
      tagsPickIcon: t("itemDialog.tagsPickIcon"),
      tagsLanguages: t("itemDialog.tagsLanguages"),
      successCreate: t("itemDialog.successCreate"),
      successUpdate: t("itemDialog.successUpdate"),
      successDelete: t("itemDialog.successDelete"),
      confirmDelete: t("itemDialog.confirmDelete"),
    },
    categoryDialog: {
      createTitle: t("categoryDialog.createTitle"),
      editTitle: t("categoryDialog.editTitle"),
      createDescription: t("categoryDialog.createDescription"),
      editDescription: t("categoryDialog.editDescription"),
      name: t("categoryDialog.name"),
      namePlaceholder: t("categoryDialog.namePlaceholder"),
      successCreate: t("categoryDialog.successCreate"),
      successUpdate: t("categoryDialog.successUpdate"),
      successDelete: t("categoryDialog.successDelete"),
      confirmDelete: t("categoryDialog.confirmDelete"),
      itemCountWarning: t.raw("categoryDialog.itemCountWarning"),
    },
    validation: {
      name: t("validation.name"),
      price: t("validation.price"),
      category: t("validation.category"),
    },
    feedback: {
      error: t("feedback.error"),
    },
    tree: {
      dragHint: t("tree.dragHint"),
      searchLocked: t("tree.searchLocked"),
      emptyCategory: t("tree.emptyCategory"),
      dragCategory: t("tree.dragCategory"),
      dragItem: t("tree.dragItem"),
    },
  };

  if (!canRead) {
    return (
      <main className="flex flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {labels.header.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.header.subtitle}
          </p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-medium">{labels.permissions.deniedTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {labels.permissions.deniedDescription}
          </p>
        </div>
      </main>
    );
  }

  return (
    <MenuPageClient
      labels={labels}
      restaurantId={restaurantId}
      currency={currency}
      canEdit={canEdit}
      items={items}
      categories={categories}
      catalogTags={catalogTags}
      tagCatalogLabels={tagCatalogLabels}
      customTagDefinitions={customTagDefinitions}
      localeOptions={localeOptions}
    />
  );
}
