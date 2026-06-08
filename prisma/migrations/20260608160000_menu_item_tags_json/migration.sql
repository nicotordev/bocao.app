-- Convert menu item tags from text[] to structured JSON
ALTER TABLE "MenuItem" ALTER COLUMN "tags" DROP DEFAULT;
ALTER TABLE "MenuItem" ALTER COLUMN "tags" TYPE JSONB USING to_jsonb("tags");
ALTER TABLE "MenuItem" ALTER COLUMN "tags" SET DEFAULT '[]'::jsonb;
