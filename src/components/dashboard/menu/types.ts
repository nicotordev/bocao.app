import type { PaginationMeta } from "@/lib/pagination";
import type { MenuItemFieldTranslations } from "@/lib/menu/item-translations";
import type { MenuCustomTagRecord } from "@/lib/menu/custom-tags.shared";
import type { MenuCategoryRecord, MenuItemRecord } from "@/lib/menu/types";
import type { MenuTagIconId } from "@/lib/menu/tag-icons";
import type { MenuItemTag } from "@/lib/menu/tag-types";
import type { ProductImagesFieldLabels } from "@/components/dashboard/product-images-field";
import type { FlowBlockType } from "@/lib/product-flow/types";
import type {
  ProductFlowBlockRecord,
  ProductFlowTemplateRecord,
  ProductPurchaseFlowRecord,
} from "@/lib/product-flow/types";
import type { ProductFlowWizardLabels } from "@/components/dashboard/orders/new/product-purchase-wizard";

export type MenuCatalogTagOption = {
  key: string;
  label: string;
  icon: MenuTagIconId;
};

export type MenuLocaleOption = {
  value: string;
  label: string;
};

export type MenuPageLabels = {
  header: {
    title: string;
    subtitle: string;
  };
  actions: {
    newItem: string;
    newCategory: string;
    refresh: string;
    edit: string;
    delete: string;
    cancel: string;
    save: string;
    create: string;
    saving: string;
  };
  filters: {
    search: string;
    searchPlaceholder: string;
    category: string;
    allCategories: string;
    showUnavailable: string;
    clear: string;
  };
  pagination: {
    previous: string;
    next: string;
    page: string;
    of: string;
  };
  empty: {
    title: string;
    description: string;
    cta: string;
    categoryCta: string;
  };
  item: {
    photos: string;
    unavailable: string;
    available: string;
    itemCount: string;
  };
  photos: ProductImagesFieldLabels & {
    saveError: string;
    saveSuccess: string;
  };
  permissions: {
    deniedTitle: string;
    deniedDescription: string;
  };
  itemDialog: {
    createTitle: string;
    editTitle: string;
    createDescription: string;
    editDescription: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    price: string;
    category: string;
    categoryPlaceholder: string;
    available: string;
    tags: string;
    tagsCatalog: string;
    tagsCustom: string;
    tagsPlaceholder: string;
    tagsAdd: string;
    tagsRemove: string;
    tagsSuggestions: string;
    tagsPickIcon: string;
    tagsLanguages: string;
    successCreate: string;
    successUpdate: string;
    successDelete: string;
    confirmDelete: string;
  };
  categoryDialog: {
    createTitle: string;
    editTitle: string;
    createDescription: string;
    editDescription: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    image: string;
    imageHint: string;
    changeImage: string;
    successCreate: string;
    successUpdate: string;
    successDelete: string;
    confirmDelete: string;
    itemCountWarning: string;
  };
  validation: {
    name: string;
    price: string;
    category: string;
  };
  feedback: {
    error: string;
  };
  importProducts: {
    button: string;
    title: string;
    description: string;
    importMode: string;
    reuseFromRestaurants: string;
    importFromFile: string;
    searchPlaceholder: string;
    empty: string;
    error: string;
    loading: string;
    selectedCount: string;
    importSelected: string;
    cancel: string;
    importedSuccessfully: string;
    importFailed: string;
    organization: string;
    restaurant: string;
    category: string;
    product: string;
    noProductsSelected: string;
    noReusableProductsFound: string;
    allOrganizations: string;
    allRestaurants: string;
    allCategories: string;
    uploadFile: string;
    downloadTemplate: string;
    previewImport: string;
    mapColumns: string;
    invalidFileFormat: string;
    invalidRows: string;
    importConfirmed: string;
    importCompleted: string;
    fileTooLarge: string;
    emptyFile: string;
    noValidRows: string;
    dropFileHint: string;
    row: string;
    errors: string;
    validRows: string;
    invalidRowsCount: string;
    confirmImport: string;
    parsing: string;
    importing: string;
    fields: {
      categoryName: string;
      productName: string;
      description: string;
      price: string;
      imageUrl: string;
      isAvailable: string;
    };
  };
  tree: {
    dragHint: string;
    searchLocked: string;
    emptyCategory: string;
    dragCategory: string;
    dragItem: string;
  };
  flow: ProductFlowLabels;
};

export type ProductFlowLabels = {
  actions: {
    openLibrary: string;
    close: string;
    save: string;
    saving: string;
    cancel: string;
  };
  feedback: {
    error: string;
  };
  validation: {
    blockLabel: string;
  };
  blockTypes: Record<FlowBlockType, string>;
  blockEditor: {
    type: string;
    key: string;
    keyPlaceholder: string;
    stepLabel: string;
    description: string;
    infoContent: string;
    placeholder: string;
    required: string;
    options: string;
    option: string;
    optionLabel: string;
    addOption: string;
    removeOption: string;
    priceDelta: string;
    priceMode: string;
    priceModeDelta: string;
    priceModeOverride: string;
    defaultOption: string;
    minSelections: string;
    maxSelections: string;
    minQuantity: string;
    maxQuantity: string;
    upsellProduct: string;
    upsellProductPlaceholder: string;
    languages: string;
  };
  contentLocales: {
    title: string;
    description: string;
    search: string;
    save: string;
    saving: string;
    cancel: string;
    success: string;
    error: string;
    minOne: string;
    open: string;
  };
  library: {
    title: string;
    description: string;
    blocks: string;
    templates: string;
    scopeType: string;
    scopeCategory: string;
    scopeProduct: string;
    scopeCategoryPlaceholder: string;
    scopeProductPlaceholder: string;
    scopeRequired: string;
    newBlock: string;
    newTemplate: string;
    empty: string;
    emptyTemplates: string;
    selectOrCreate: string;
    selectOrCreateDescription: string;
    createTitle: string;
    editTitle: string;
    createTemplateTitle: string;
    editTemplateTitle: string;
    templateName: string;
    templateDescription: string;
    deleteBlock: string;
    deleteTemplate: string;
    confirmDelete: string;
    confirmDeleteTemplate: string;
    successCreate: string;
    successUpdate: string;
    successDelete: string;
    successCreateTemplate: string;
    successUpdateTemplate: string;
    successDeleteTemplate: string;
  };
  builder: {
    title: string;
    description: string;
    enabled: string;
    library: string;
    emptyLibrary: string;
    steps: string;
    stepCount: string;
    emptySteps: string;
    preview: string;
    applyTemplate: string;
    templatePlaceholder: string;
    conditional: string;
    step: string;
    ariaReorder: string;
    ariaRemoveStep: string;
    tab: string;
    saved: string;
    saveError: string;
    inactiveHint: string;
    addStep: string;
    editStep: string;
    selectStep: string;
    fromLibrary: string;
  };
  wizard: ProductFlowWizardLabels;
  item: {
    hasFlow: string;
  };
};

export type MenuPageClientProps = {
  labels: MenuPageLabels;
  restaurantId: string;
  currency: string;
  canEdit: boolean;
  items: MenuItemRecord[];
  categories: MenuCategoryRecord[];
  pagination: PaginationMeta;
  catalogTags: MenuCatalogTagOption[];
  tagCatalogLabels: Record<string, string>;
  customTagDefinitions: MenuCustomTagRecord[];
  localeOptions: MenuLocaleOption[];
  flowBlocks: ProductFlowBlockRecord[];
  flowTemplates: ProductFlowTemplateRecord[];
  productFlowsByMenuItemId: Record<string, ProductPurchaseFlowRecord>;
};

export type MenuItemFormValues = {
  categoryId: string;
  translations: MenuItemFieldTranslations;
  price: string;
  isAvailable: boolean;
  images: string[];
  tags: MenuItemTag[];
  purchaseFlow: {
    isActive: boolean;
    steps: import("@/lib/product-flow/types").FlowStep[];
  };
};
