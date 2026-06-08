export type AdminEmailPatterns = {
  emails: Set<string>;
  domains: Set<string>;
};

function normalizeDomain(value: string): string {
  const trimmed = value.trim().toLowerCase();

  if (trimmed.startsWith("@")) {
    return trimmed.slice(1);
  }

  return trimmed;
}

export function parseAdminEmails(
  raw: string | undefined,
): AdminEmailPatterns | null {
  if (!raw?.trim()) {
    return null;
  }

  const emails = new Set<string>();
  const domains = new Set<string>();

  for (const entry of raw.split(",")) {
    const value = entry.trim().toLowerCase();

    if (!value) {
      continue;
    }

    if (value.includes("@")) {
      if (value.startsWith("@")) {
        domains.add(normalizeDomain(value));
      } else {
        emails.add(value);
      }
      continue;
    }

    domains.add(normalizeDomain(value));
  }

  if (emails.size === 0 && domains.size === 0) {
    return null;
  }

  return { emails, domains };
}

export function matchesAdminEmail(
  email: string,
  patterns: AdminEmailPatterns,
): boolean {
  const normalized = email.trim().toLowerCase();

  if (patterns.emails.has(normalized)) {
    return true;
  }

  const atIndex = normalized.lastIndexOf("@");

  if (atIndex === -1) {
    return false;
  }

  const domain = normalized.slice(atIndex + 1);

  return patterns.domains.has(domain);
}

export function getAdminEmailPatterns(): AdminEmailPatterns | null {
  return parseAdminEmails(process.env.ADMIN_EMAILS);
}
