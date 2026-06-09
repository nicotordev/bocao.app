import { getLocale, getTranslations } from "next-intl/server";
import { MenuPageClient } from "@/components/dashboard/menu/menu-page-client";
import type { MenuPageLabels } from "@/components/dashboard/menu/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { listMenuCustomTags } from "@/lib/menu/custom-tags.server";
import { parseMenuListSearchParams } from "@/lib/menu/filters";
import {
  listMenuCategories,
  listMenuItemRecordsPaginated,
} from "@/lib/menu/repository";
import { searchParamsToRecord } from "@/lib/list-url";
import {
  listProductFlowBlocks,
  listProductFlowTemplates,
  listProductPurchaseFlows,
} from "@/lib/product-flow/repository";
import { MENU_TAG_CATALOG, MENU_TAG_CATALOG_KEYS } from "@/lib/menu/tag-types";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import {
  buildRestaurantLocaleOptions,
  DEFAULT_CONTENT_LOCALES,
  getRestaurantContentLocales,
} from "@/lib/restaurant/content-locales";

type MenuPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const t = await getTranslations("dashboard.menu");
  const tCommon = await getTranslations("common");
  const uiLocale = await getLocale();
  const resolvedSearchParams = searchParamsToRecord(await searchParams);
  const menuFilters = parseMenuListSearchParams(resolvedSearchParams);
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const currency = context?.activeRestaurant?.currency ?? "CLP";
  const canEdit =
    context?.membership.permissions.includes(PERMISSIONS.MENU_WRITE) ?? false;
  const canRead =
    context?.membership.permissions.includes(PERMISSIONS.MENU_READ) ?? false;

  const [
    menuList,
    categories,
    customTagDefinitions,
    flowBlocks,
    flowTemplates,
    flows,
  ] = restaurantId
    ? await Promise.all([
        listMenuItemRecordsPaginated(restaurantId, { filters: menuFilters }),
        listMenuCategories(restaurantId),
        listMenuCustomTags(restaurantId),
        listProductFlowBlocks(restaurantId),
        listProductFlowTemplates(restaurantId),
        listProductPurchaseFlows(restaurantId),
      ])
    : [
        {
          items: [],
          pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        },
        [],
        [],
        [],
        [],
        [],
      ];

  const items = menuList.items;
  const pagination = menuList.pagination;

  const productFlowsByMenuItemId = Object.fromEntries(
    flows.map((flow) => [flow.menuItemId, flow]),
  );

  const contentLocales = restaurantId
    ? await getRestaurantContentLocales(restaurantId)
    : DEFAULT_CONTENT_LOCALES;
  const localeOptions = buildRestaurantLocaleOptions(contentLocales, uiLocale);

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
    pagination: {
      previous: tCommon("pagination.previous"),
      next: tCommon("pagination.next"),
      page: tCommon("pagination.page"),
      of: tCommon("pagination.of"),
    },
    tree: {
      dragHint: t("tree.dragHint"),
      searchLocked: t("tree.searchLocked"),
      emptyCategory: t("tree.emptyCategory"),
      dragCategory: t("tree.dragCategory"),
      dragItem: t("tree.dragItem"),
    },
    flow: {
      actions: {
        openLibrary: t("flow.actions.openLibrary"),
        close: t("flow.actions.close"),
        save: t("flow.actions.save"),
        saving: t("flow.actions.saving"),
      },
      feedback: {
        error: t("flow.feedback.error"),
      },
      validation: {
        blockLabel: t("flow.validation.blockLabel"),
      },
      blockTypes: {
        choice: t("flow.blockTypes.choice"),
        multi_choice: t("flow.blockTypes.multi_choice"),
        quantity: t("flow.blockTypes.quantity"),
        text: t("flow.blockTypes.text"),
        info: t("flow.blockTypes.info"),
        upsell: t("flow.blockTypes.upsell"),
      },
      blockEditor: {
        type: t("flow.blockEditor.type"),
        key: t("flow.blockEditor.key"),
        keyPlaceholder: t("flow.blockEditor.keyPlaceholder"),
        stepLabel: t("flow.blockEditor.stepLabel"),
        description: t("flow.blockEditor.description"),
        infoContent: t("flow.blockEditor.infoContent"),
        placeholder: t("flow.blockEditor.placeholder"),
        required: t("flow.blockEditor.required"),
        options: t("flow.blockEditor.options"),
        option: t("flow.blockEditor.option"),
        optionLabel: t("flow.blockEditor.optionLabel"),
        addOption: t("flow.blockEditor.addOption"),
        removeOption: t("flow.blockEditor.removeOption"),
        priceDelta: t("flow.blockEditor.priceDelta"),
        priceMode: t("flow.blockEditor.priceMode"),
        priceModeDelta: t("flow.blockEditor.priceModeDelta"),
        priceModeOverride: t("flow.blockEditor.priceModeOverride"),
        defaultOption: t("flow.blockEditor.defaultOption"),
        minSelections: t("flow.blockEditor.minSelections"),
        maxSelections: t("flow.blockEditor.maxSelections"),
        minQuantity: t("flow.blockEditor.minQuantity"),
        maxQuantity: t("flow.blockEditor.maxQuantity"),
        upsellProduct: t("flow.blockEditor.upsellProduct"),
        upsellProductPlaceholder: t(
          "flow.blockEditor.upsellProductPlaceholder",
        ),
        languages: t("flow.blockEditor.languages"),
      },
      contentLocales: {
        title: t("flow.contentLocales.title"),
        description: t("flow.contentLocales.description"),
        search: t("flow.contentLocales.search"),
        save: t("flow.contentLocales.save"),
        saving: t("flow.contentLocales.saving"),
        cancel: t("flow.contentLocales.cancel"),
        success: t("flow.contentLocales.success"),
        error: t("flow.contentLocales.error"),
        minOne: t("flow.contentLocales.minOne"),
        open: t("flow.contentLocales.open"),
      },
      library: {
        title: t("flow.library.title"),
        description: t("flow.library.description"),
        blocks: t("flow.library.blocks"),
        templates: t("flow.library.templates"),
        scopeType: t("flow.library.scopeType"),
        scopeCategory: t("flow.library.scopeCategory"),
        scopeProduct: t("flow.library.scopeProduct"),
        scopeCategoryPlaceholder: t("flow.library.scopeCategoryPlaceholder"),
        scopeProductPlaceholder: t("flow.library.scopeProductPlaceholder"),
        scopeRequired: t("flow.library.scopeRequired"),
        newBlock: t("flow.library.newBlock"),
        newTemplate: t("flow.library.newTemplate"),
        empty: t("flow.library.empty"),
        emptyTemplates: t("flow.library.emptyTemplates"),
        selectOrCreate: t("flow.library.selectOrCreate"),
        selectOrCreateDescription: t("flow.library.selectOrCreateDescription"),
        createTitle: t("flow.library.createTitle"),
        editTitle: t("flow.library.editTitle"),
        createTemplateTitle: t("flow.library.createTemplateTitle"),
        editTemplateTitle: t("flow.library.editTemplateTitle"),
        templateName: t("flow.library.templateName"),
        templateDescription: t("flow.library.templateDescription"),
        deleteBlock: t("flow.library.deleteBlock"),
        deleteTemplate: t("flow.library.deleteTemplate"),
        confirmDelete: t("flow.library.confirmDelete"),
        confirmDeleteTemplate: t("flow.library.confirmDeleteTemplate"),
        successCreate: t("flow.library.successCreate"),
        successUpdate: t("flow.library.successUpdate"),
        successDelete: t("flow.library.successDelete"),
        successCreateTemplate: t("flow.library.successCreateTemplate"),
        successUpdateTemplate: t("flow.library.successUpdateTemplate"),
        successDeleteTemplate: t("flow.library.successDeleteTemplate"),
      },
      builder: {
        title: t("flow.builder.title"),
        description: t("flow.builder.description"),
        enabled: t("flow.builder.enabled"),
        library: t("flow.builder.library"),
        emptyLibrary: t("flow.builder.emptyLibrary"),
        steps: t("flow.builder.steps"),
        stepCount: t.raw("flow.builder.stepCount"),
        emptySteps: t("flow.builder.emptySteps"),
        preview: t("flow.builder.preview"),
        applyTemplate: t("flow.builder.applyTemplate"),
        templatePlaceholder: t("flow.builder.templatePlaceholder"),
        conditional: t("flow.builder.conditional"),
        step: t("flow.builder.step"),
        ariaReorder: t("flow.builder.ariaReorder"),
        ariaRemoveStep: t("flow.builder.ariaRemoveStep"),
        tab: t("flow.builder.tab"),
        saved: t("flow.builder.saved"),
        saveError: t("flow.builder.saveError"),
        inactiveHint: t("flow.builder.inactiveHint"),
      },
      wizard: {
        title: t("flow.wizard.title"),
        description: t.raw("flow.wizard.description"),
        stepOf: t.raw("flow.wizard.stepOf"),
        back: t("flow.wizard.back"),
        next: t("flow.wizard.next"),
        confirm: t("flow.wizard.confirm"),
        cancel: t("flow.wizard.cancel"),
        required: t("flow.wizard.required"),
        optional: t("flow.wizard.optional"),
        quantity: t("flow.wizard.quantity"),
        upsellAccept: t("flow.wizard.upsellAccept"),
        upsellDecline: t("flow.wizard.upsellDecline"),
        total: t("flow.wizard.total"),
        validationError: t("flow.wizard.validationError"),
      },
      item: {
        hasFlow: t("flow.item.hasFlow"),
      },
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
      pagination={pagination}
      catalogTags={catalogTags}
      tagCatalogLabels={tagCatalogLabels}
      customTagDefinitions={customTagDefinitions}
      localeOptions={localeOptions}
      flowBlocks={flowBlocks}
      flowTemplates={flowTemplates}
      productFlowsByMenuItemId={productFlowsByMenuItemId}
      contentLocales={contentLocales}
    />
  );
}
