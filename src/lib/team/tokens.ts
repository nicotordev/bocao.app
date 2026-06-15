import { createHash, randomBytes } from "node:crypto";

const INVITATION_TTL_DAYS = 7;

export function generateInvitationToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  return { token, tokenHash };
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getInvitationExpiryDate(now = new Date()): Date {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_TTL_DAYS);
  return expiresAt;
}

export function buildInvitationAcceptUrl(token: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : null);

  if (!baseUrl) {
    throw new Error(
      "Missing app URL. Set NEXT_PUBLIC_APP_URL or BETTER_AUTH_URL in production.",
    );
  }

  const url = new URL("/accept-invitation", baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
}
