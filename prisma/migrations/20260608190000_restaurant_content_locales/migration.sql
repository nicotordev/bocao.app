-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN "contentLocales" TEXT[] NOT NULL DEFAULT ARRAY['es', 'en']::TEXT[];
