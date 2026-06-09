const TAGS_PREFIX = "__BOCAO_TAGS__:";

export function parseCustomerTags(notes: string | null | undefined): string[] {
  if (!notes) {
    return [];
  }

  const tagLine = notes
    .split("\n")
    .find((line) => line.startsWith(TAGS_PREFIX));

  if (!tagLine) {
    return [];
  }

  try {
    const parsed = JSON.parse(tagLine.slice(TAGS_PREFIX.length)) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((tag): tag is string => typeof tag === "string");
  } catch {
    return [];
  }
}

export function stripCustomerTags(notes: string | null | undefined): string | null {
  if (!notes) {
    return null;
  }

  const cleaned = notes
    .split("\n")
    .filter((line) => !line.startsWith(TAGS_PREFIX))
    .join("\n")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

export function parseCustomerAllergies(
  notes: string | null | undefined,
): string | null {
  const visibleNotes = stripCustomerTags(notes);

  if (!visibleNotes) {
    return null;
  }

  const allergyLine = visibleNotes
    .split("\n")
    .find((line) => /alerg/i.test(line));

  return allergyLine?.trim() ?? null;
}
