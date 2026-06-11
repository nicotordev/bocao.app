export function kitchenRedisChannel(restaurantId: string): string {
  return `kitchen:${restaurantId}`;
}

export function whatsappRedisChannel(restaurantId: string): string {
  return `restaurant:${restaurantId}:whatsapp`;
}

export const KITCHEN_REDIS_PATTERN = "kitchen:*";
