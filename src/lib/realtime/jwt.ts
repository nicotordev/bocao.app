import { createHmac, timingSafeEqual } from "node:crypto";
import type { KitchenRealtimeTokenPayload } from "@/lib/realtime/types";

const TOKEN_TTL_SECONDS = 300;

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function getKitchenRealtimeSecret(): string | null {
  return process.env.KITCHEN_REALTIME_SECRET?.trim() || null;
}

export function signKitchenRealtimeToken(input: {
  userId: string;
  restaurantId: string;
  tenantId: string;
  ttlSeconds?: number;
}): string | null {
  const secret = getKitchenRealtimeSecret();

  if (!secret) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = input.ttlSeconds ?? TOKEN_TTL_SECONDS;
  const payload: KitchenRealtimeTokenPayload = {
    sub: input.userId,
    restaurantId: input.restaurantId,
    tenantId: input.tenantId,
    scope: "kitchen:read",
    iat: now,
    exp: now + ttl,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${header}.${body}.${signature}`;
}

export function verifyKitchenRealtimeToken(
  token: string,
): KitchenRealtimeTokenPayload | null {
  const secret = getKitchenRealtimeSecret();

  if (!secret) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expectedSignature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(body),
    ) as KitchenRealtimeTokenPayload;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.restaurantId !== "string" ||
      typeof payload.tenantId !== "string" ||
      payload.scope !== "kitchen:read" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
