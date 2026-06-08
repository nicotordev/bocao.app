import type { PrismaClient } from "@/generated/prisma/client";

type Db = Pick<PrismaClient, "organization">;

export function slugifyOrganizationName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base.length > 0 ? base : "restaurante";
}

export async function createUniqueOrganizationSlug(
  db: Db,
  name: string,
): Promise<string> {
  const baseSlug = slugifyOrganizationName(name);
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await db.organization.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}
