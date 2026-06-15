import type { BusinessType as PrismaBusinessType } from "@/generated/prisma/client";
import type { TeamRole } from "@/lib/team/permissions";
import type {
  BusinessType,
  MemberStatus,
  TeamMemberRole,
} from "@/components/dashboard/settings/types";

const UI_TO_PRISMA_BUSINESS_TYPE: Record<BusinessType, PrismaBusinessType> = {
  restaurant: "RESTAURANT",
  cafe: "CAFE",
  sushi: "OTHER",
  dark_kitchen: "DARK_KITCHEN",
  food_truck: "OTHER",
  bar: "BAR",
  bakery: "OTHER",
};

const PRISMA_TO_UI_BUSINESS_TYPE: Record<PrismaBusinessType, BusinessType> = {
  RESTAURANT: "restaurant",
  CAFE: "cafe",
  DARK_KITCHEN: "dark_kitchen",
  BAR: "bar",
  OTHER: "restaurant",
};

export function toUiBusinessType(
  value: PrismaBusinessType | null | undefined,
): BusinessType {
  if (!value) {
    return "restaurant";
  }

  return PRISMA_TO_UI_BUSINESS_TYPE[value];
}

export function toPrismaBusinessType(
  value: BusinessType,
): PrismaBusinessType {
  return UI_TO_PRISMA_BUSINESS_TYPE[value];
}

export function mapTeamRoleToSettingsRole(
  role: TeamRole | "staff",
): TeamMemberRole {
  if (role === "owner") {
    return "owner";
  }

  if (role === "manager" || role === "admin") {
    return "manager";
  }

  return "staff";
}

export function mapMembershipStatusToSettingsStatus(
  status: "active" | "inactive" | "removed",
): MemberStatus {
  if (status === "active") {
    return "active";
  }

  if (status === "inactive") {
    return "inactive";
  }

  return "inactive";
}
