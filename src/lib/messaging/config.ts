import { prisma } from "@/lib/prisma";

export type WebhookRestaurantScope = {
  restaurantId: string;
  tenantId: string;
};

export type MetaWhatsAppCredentials = {
  accessToken: string;
  phoneNumberId: string;
};

function getLegacyEnvRestaurantScope(): {
  restaurantId: string;
  phoneNumberId: string;
} | null {
  const restaurantId = process.env.META_WHATSAPP_RESTAURANT_ID?.trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!restaurantId || !phoneNumberId) {
    return null;
  }

  return { restaurantId, phoneNumberId };
}

function getLegacyEnvMetaCredentials(): MetaWhatsAppCredentials | null {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
  const legacy = getLegacyEnvRestaurantScope();

  if (!accessToken || !legacy) {
    return null;
  }

  return {
    accessToken,
    phoneNumberId: legacy.phoneNumberId,
  };
}

/**
 * Resolves the restaurant that should receive webhook traffic for a Meta
 * `phone_number_id` included in the webhook payload.
 */
export async function resolveWebhookRestaurant(input: {
  phoneNumberId: string;
}): Promise<WebhookRestaurantScope | null> {
  const phoneNumberId = input.phoneNumberId.trim();

  if (!phoneNumberId) {
    console.warn("[whatsapp-webhook] missing phone_number_id in webhook event");
    return null;
  }

  const config = await prisma.restaurantWhatsAppConfig.findUnique({
    where: { phoneNumberId },
    select: {
      restaurantId: true,
      organizationId: true,
    },
  });

  if (config) {
    return {
      restaurantId: config.restaurantId,
      tenantId: config.organizationId,
    };
  }

  const legacy = getLegacyEnvRestaurantScope();

  if (legacy?.phoneNumberId === phoneNumberId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: legacy.restaurantId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (restaurant) {
      return {
        restaurantId: restaurant.id,
        tenantId: restaurant.organizationId,
      };
    }

    console.warn(
      "[whatsapp-webhook] configured META_WHATSAPP_RESTAURANT_ID was not found",
      { restaurantId: legacy.restaurantId, phoneNumberId },
    );
    return null;
  }

  console.warn("[whatsapp-webhook] no restaurant mapped to phone_number_id", {
    phoneNumberId,
  });
  return null;
}

export async function getRestaurantMetaWhatsAppCredentials(
  restaurantId: string,
): Promise<MetaWhatsAppCredentials | null> {
  const config = await prisma.restaurantWhatsAppConfig.findUnique({
    where: { restaurantId },
    select: {
      accessToken: true,
      phoneNumberId: true,
    },
  });

  if (config) {
    return {
      accessToken: config.accessToken,
      phoneNumberId: config.phoneNumberId,
    };
  }

  const legacy = getLegacyEnvRestaurantScope();

  if (legacy?.restaurantId === restaurantId) {
    return getLegacyEnvMetaCredentials();
  }

  return null;
}

export function getWhatsAppProvider(): "meta" | "twilio" {
  const provider = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();

  if (provider === "twilio") {
    return "twilio";
  }

  return "meta";
}
