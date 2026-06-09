-- CreateEnum
CREATE TYPE "FlowLibraryScope" AS ENUM ('CATEGORY', 'MENU_ITEM');

-- AlterTable ProductFlowBlock
ALTER TABLE "ProductFlowBlock" ADD COLUMN "scopeType" "FlowLibraryScope";
ALTER TABLE "ProductFlowBlock" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "ProductFlowBlock" ADD COLUMN "menuItemId" TEXT;

UPDATE "ProductFlowBlock" AS block
SET
  "scopeType" = 'CATEGORY',
  "categoryId" = (
    SELECT category.id
    FROM "MenuCategory" AS category
    WHERE category."restaurantId" = block."restaurantId"
    ORDER BY category."sortOrder", category."name"
    LIMIT 1
  )
WHERE block."scopeType" IS NULL;

DELETE FROM "ProductFlowBlock" WHERE "scopeType" IS NULL;

ALTER TABLE "ProductFlowBlock" ALTER COLUMN "scopeType" SET NOT NULL;

DROP INDEX "ProductFlowBlock_restaurantId_key_key";

CREATE UNIQUE INDEX "ProductFlowBlock_restaurantId_scopeType_categoryId_menuItemId_key_key"
ON "ProductFlowBlock"("restaurantId", "scopeType", "categoryId", "menuItemId", "key");

CREATE INDEX "ProductFlowBlock_categoryId_idx" ON "ProductFlowBlock"("categoryId");
CREATE INDEX "ProductFlowBlock_menuItemId_idx" ON "ProductFlowBlock"("menuItemId");

ALTER TABLE "ProductFlowBlock"
ADD CONSTRAINT "ProductFlowBlock_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductFlowBlock"
ADD CONSTRAINT "ProductFlowBlock_menuItemId_fkey"
FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable ProductFlowTemplate
ALTER TABLE "ProductFlowTemplate" ADD COLUMN "scopeType" "FlowLibraryScope";
ALTER TABLE "ProductFlowTemplate" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "ProductFlowTemplate" ADD COLUMN "menuItemId" TEXT;

UPDATE "ProductFlowTemplate" AS template
SET
  "scopeType" = 'CATEGORY',
  "categoryId" = (
    SELECT category.id
    FROM "MenuCategory" AS category
    WHERE category."restaurantId" = template."restaurantId"
    ORDER BY category."sortOrder", category."name"
    LIMIT 1
  )
WHERE template."scopeType" IS NULL;

DELETE FROM "ProductFlowTemplate" WHERE "scopeType" IS NULL;

ALTER TABLE "ProductFlowTemplate" ALTER COLUMN "scopeType" SET NOT NULL;

CREATE INDEX "ProductFlowTemplate_categoryId_idx" ON "ProductFlowTemplate"("categoryId");
CREATE INDEX "ProductFlowTemplate_menuItemId_idx" ON "ProductFlowTemplate"("menuItemId");

ALTER TABLE "ProductFlowTemplate"
ADD CONSTRAINT "ProductFlowTemplate_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductFlowTemplate"
ADD CONSTRAINT "ProductFlowTemplate_menuItemId_fkey"
FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
