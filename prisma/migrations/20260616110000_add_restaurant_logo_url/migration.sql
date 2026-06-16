-- Add persisted logo URL for restaurant branding in settings
ALTER TABLE "Restaurant"
ADD COLUMN "logoUrl" TEXT;
