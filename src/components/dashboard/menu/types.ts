import type { MenuItemRecord } from "@/lib/menu/types";

export type MenuPageLabels = {
  header: {
    title: string;
    subtitle: string;
  };
  empty: {
    title: string;
    description: string;
  };
  item: {
    photos: string;
    unavailable: string;
  };
  photos: {
    addPhoto: string;
    removePhoto: string;
    uploading: string;
    uploadError: string;
    invalidImageType: string;
    imageTooLarge: string;
    storageNotConfigured: string;
    saveError: string;
    saveSuccess: string;
  };
  permissions: {
    deniedTitle: string;
    deniedDescription: string;
  };
};

export type MenuPageClientProps = {
  labels: MenuPageLabels;
  restaurantId: string;
  currency: string;
  canEdit: boolean;
  items: MenuItemRecord[];
};
