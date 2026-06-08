import type { PermissionKey, SystemRoleSlug } from "@/lib/rbac/permissions";
import {
  membershipHasPermission,
  getMembershipWithPermissions,
} from "@/lib/rbac/can";
import { getVisibleNavItems, type NavItem } from "@/lib/navigation";

export {
  can,
  getMembershipWithPermissions,
  membershipHasPermission,
} from "@/lib/rbac/can";

export {
  PERMISSIONS,
  SYSTEM_ROLE_SLUGS,
  type PermissionKey,
  type SystemRoleSlug,
} from "@/lib/rbac/permissions";

export type MembershipWithPermissions = NonNullable<
  Awaited<ReturnType<typeof getMembershipWithPermissions>>
>;

export function extractPermissionKeys(
  membership: MembershipWithPermissions,
): Set<PermissionKey> {
  const keys = membership.role.rolePermissions.map(
    (rolePermission) => rolePermission.permission.key as PermissionKey,
  );

  return new Set(keys);
}

export function canAccessNavItem(
  permissions: ReadonlySet<PermissionKey>,
  roleSlug: SystemRoleSlug,
  item: NavItem,
): boolean {
  if (item.allowedRoles && !item.allowedRoles.includes(roleSlug)) {
    return false;
  }

  if (!item.permission) {
    return true;
  }

  return permissions.has(item.permission);
}

export function getNavigationForMembership(
  membership: MembershipWithPermissions,
): NavItem[] {
  const permissions = extractPermissionKeys(membership);
  const roleSlug = membership.role.slug as SystemRoleSlug;

  return getVisibleNavItems(permissions, roleSlug);
}

export function hasPermission(
  membership: MembershipWithPermissions | null,
  permission: PermissionKey,
): boolean {
  return membershipHasPermission(membership, permission);
}
