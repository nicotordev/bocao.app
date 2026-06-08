import type { MenuCategoryRecord, MenuItemRecord } from "@/lib/menu/types";
import type { MenuTagIconId } from "@/lib/menu/tag-icons";
import type { ProductImagesFieldLabels } from "@/components/dashboard/product-images-field";

export type MenuCatalogTagOption = {
  key: string;
  label: string;
  icon: MenuTagIconId;
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
  tree: {
    dragHint: string;
    searchLocked: string;
    emptyCategory: string;
    dragCategory: string;
    dragItem: string;
  };
};

export type MenuPageClientProps = {
  labels: MenuPageLabels;
  restaurantId: string;
  currency: string;
  canEdit: boolean;
  items: MenuItemRecord[];
  categories: MenuCategoryRecord[];
  catalogTags: MenuCatalogTagOption[];
  tagCatalogLabels: Record<string, string>;
};

import type { MenuItemTag } from "@/lib/menu/tag-types";

export type MenuItemFormValues = {
  categoryId: string;
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
  images: string[];
  tags: MenuItemTag[];
};
