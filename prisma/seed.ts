import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PERMISSION_CATALOG } from "../src/lib/rbac/permissions";
import { syncAllOrganizationRoles } from "../src/lib/rbac/seed-organization-roles";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  for (const permission of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        module: permission.module,
        description: permission.description,
      },
      create: {
        key: permission.key,
        module: permission.module,
        description: permission.description,
      },
    });
  }

  const count = await prisma.permission.count();
  console.log(`Seeded ${count} permissions`);

  const organizationCount = await syncAllOrganizationRoles(prisma);
  console.log(`Synced roles for ${organizationCount} organizations`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
