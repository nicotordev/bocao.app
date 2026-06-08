import { z } from "zod";

export const updateMenuItemImagesSchema = z.object({
  restaurantId: z.string().cuid(),
  menuItemId: z.string().cuid(),
  images: z.array(z.string().url()).max(8),
});
