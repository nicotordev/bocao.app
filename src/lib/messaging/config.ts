import { prisma } from "@/lib/prisma";

/**
 * Resolves the restaurant that receives webhook traffic.
 * TODO: support per-restaurant Meta credentials stored in the database.
 */
export async function resolveWebhookRestaurant(): Promise<{
  restaurantId: string;
  tenantId: string;
} | null> {
  const restaurantId = process.env.META_WHATSAPP_RESTAURANT_ID?.trim();

  if (!restaurantId) {
    console.warn(
      "[whatsapp-webhook] META_WHATSAPP_RESTAURANT_ID is not configured",
    );
    return null;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      organizationId: true,
    },
  });

  if (!restaurant) {
    console.warn(
      "[whatsapp-webhook] configured META_WHATSAPP_RESTAURANT_ID was not found",
      { restaurantId },
    );
    return null;
  }

  return {
    restaurantId: restaurant.id,
    tenantId: restaurant.organizationId,
  };
}

export function getWhatsAppProvider(): "meta" | "twilio" {
  const provider = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();

  if (provider === "twilio") {
    return "twilio";
  }

  return "meta";
}
