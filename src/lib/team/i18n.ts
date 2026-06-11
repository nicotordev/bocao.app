import type { TeamPermission } from "@/lib/team/permissions";

export const TEAM_PERMISSION_MESSAGE_KEYS = {
  "team.read": "permissionLabels.team.read",
  "team.invite": "permissionLabels.team.invite",
  "team.update": "permissionLabels.team.update",
  "team.remove": "permissionLabels.team.remove",
  "orders.read": "permissionLabels.orders.read",
  "orders.create": "permissionLabels.orders.create",
  "orders.update": "permissionLabels.orders.update",
  "orders.cancel": "permissionLabels.orders.cancel",
  "payments.read": "permissionLabels.payments.read",
  "payments.create": "permissionLabels.payments.create",
  "kitchen.read": "permissionLabels.kitchen.read",
  "kitchen.update": "permissionLabels.kitchen.update",
  "reservations.read": "permissionLabels.reservations.read",
  "reservations.update": "permissionLabels.reservations.update",
  "customers.read": "permissionLabels.customers.read",
  "customers.update": "permissionLabels.customers.update",
  "marketing.read": "permissionLabels.marketing.read",
  "marketing.update": "permissionLabels.marketing.update",
  "analytics.read": "permissionLabels.analytics.read",
  "settings.read": "permissionLabels.settings.read",
  "settings.update": "permissionLabels.settings.update",
} as const;

export type TeamPermissionMessageKey =
  (typeof TEAM_PERMISSION_MESSAGE_KEYS)[TeamPermission];

export function teamPermissionMessageKey(
  permission: TeamPermission,
): TeamPermissionMessageKey {
  return TEAM_PERMISSION_MESSAGE_KEYS[permission];
}
