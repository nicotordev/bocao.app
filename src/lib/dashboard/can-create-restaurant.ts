import type { DashboardMembership } from "@/lib/dashboard/types";
import { PERMISSIONS, SYSTEM_ROLE_SLUGS } from "@/lib/rbac/permissions";

export function canCreateRestaurant(membership: DashboardMembership): boolean {
  return (
    membership.roleSlug === SYSTEM_ROLE_SLUGS.OWNER ||
    membership.permissions.includes(PERMISSIONS.RESTAURANT_WRITE) ||
    membership.permissions.includes(PERMISSIONS.SETTINGS_WRITE)
  );
}
