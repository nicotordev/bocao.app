import Redis from "ioredis";

type RedisRole = "publisher" | "subscriber";

let publisher: Redis | null = null;

function getRedisUrl(): string | null {
  const url = process.env.REDIS_URL?.trim();
  return url && url.length > 0 ? url : null;
}

function createRedisClient(role: RedisRole): Redis | null {
  const url = getRedisUrl();

  if (!url) {
    return null;
  }

  return new Redis(url, {
    maxRetriesPerRequest: role === "publisher" ? 3 : null,
    lazyConnect: true,
    connectionName: `bocao-${role}`,
  });
}

export function getRedisPublisher(): Redis | null {
  if (!publisher) {
    publisher = createRedisClient("publisher");
  }

  return publisher;
}

export function createRedisSubscriber(): Redis | null {
  return createRedisClient("subscriber");
}

export function isRedisConfigured(): boolean {
  return getRedisUrl() !== null;
}
