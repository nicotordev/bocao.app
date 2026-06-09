export type KitchenStationCategory =
  | "grill"
  | "fryer"
  | "sushi"
  | "bar"
  | "desserts"
  | "delivery"
  | "prep"
  | "other";

export type KitchenStationConfig = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  category: KitchenStationCategory;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type KitchenStationWithStats = KitchenStationConfig & {
  activeOrderCount: number;
};

export type KitchenStationsListResponse = {
  stations: KitchenStationWithStats[];
  restaurantId: string;
  updatedAt: string;
};
