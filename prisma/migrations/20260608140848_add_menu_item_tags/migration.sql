-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
