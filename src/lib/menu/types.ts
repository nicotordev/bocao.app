export type MenuItemOption = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  categoryName: string;
  images: string[];
};

export type MenuItemRecord = MenuItemOption & {
  isAvailable: boolean;
};
