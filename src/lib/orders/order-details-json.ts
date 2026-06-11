export function parseOrderDetailsJson<T extends Record<string, unknown>>(
  details: unknown,
): T {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {} as T;
  }

  return details as T;
}
