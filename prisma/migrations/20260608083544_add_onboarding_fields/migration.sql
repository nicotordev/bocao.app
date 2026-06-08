-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('RESTAURANT', 'BAR', 'CAFE', 'DARK_KITCHEN', 'OTHER');

-- CreateEnum
CREATE TYPE "PrimaryGoal" AS ENUM ('ORDERS', 'RESERVATIONS', 'WHATSAPP', 'MENU');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'CL';

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "businessType" "BusinessType",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "primaryGoal" "PrimaryGoal",
ADD COLUMN     "serviceModes" "OrderType"[] DEFAULT ARRAY[]::"OrderType"[];
