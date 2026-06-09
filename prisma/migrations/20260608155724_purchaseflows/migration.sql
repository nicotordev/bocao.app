/*
  Warnings:

  - Made the column `tags` on table `MenuItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "MenuItem" ALTER COLUMN "tags" SET NOT NULL;
