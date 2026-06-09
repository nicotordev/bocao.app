import type { KitchenStationCategory } from "@/lib/kitchen/stations/types";

export type KitchenStationsLabels = {
  header: {
    title: string;
    subtitle: string;
    backToKitchen: string;
    createStation: string;
  };
  card: {
    description: string;
    noDescription: string;
    category: string;
    activeOrders: string;
    activeOrdersCount: string;
    sortOrder: string;
    edit: string;
    activate: string;
    deactivate: string;
    delete: string;
    moveUp: string;
    moveDown: string;
    deleteBlocked: string;
  };
  status: {
    active: string;
    inactive: string;
  };
  categories: Record<KitchenStationCategory, string>;
  form: {
    createTitle: string;
    createDescription: string;
    editTitle: string;
    editDescription: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    sortOrder: string;
    sortOrderHint: string;
    isActive: string;
    isActiveHint: string;
    save: string;
    saving: string;
    cancel: string;
    delete: string;
    confirmDelete: string;
  };
  empty: {
    title: string;
    description: string;
    cta: string;
  };
  loading: string;
  feedback: {
    createSuccess: string;
    updateSuccess: string;
    deleteSuccess: string;
    toggleSuccess: string;
    error: string;
    deleteBlocked: string;
  };
  validation: {
    name: string;
  };
  permissions: {
    deniedDescription: string;
  };
};
