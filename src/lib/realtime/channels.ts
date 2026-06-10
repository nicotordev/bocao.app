export function kitchenRedisChannel(restaurantId: string): string {
  return `kitchen:${restaurantId}`;
}

export const KITCHEN_REDIS_PATTERN = "kitchen:*";
