import { PERMISSIONS, type PermissionKey } from "@/lib/rbac/permissions";

export type TeamRole =
  | "owner"
  | "admin"
  | "manager"
  | "cashier"
  | "kitchen"
  | "waiter"
  | "marketing"
  | "viewer";

export type TeamPermission =
  | "team.read"
  | "team.invite"
  | "team.update"
  | "team.remove"
  | "menu.read"
  | "menu.update"
  | "orders.read"
  | "orders.create"
  | "orders.update"
  | "orders.cancel"
  | "payments.read"
  | "payments.create"
  | "kitchen.read"
  | "kitchen.update"
  | "reservations.read"
  | "reservations.update"
  | "customers.read"
  | "customers.update"
  | "marketing.read"
  | "marketing.update"
  | "whatsapp.read"
  | "whatsapp.update"
  | "analytics.read"
  | "settings.read"
  | "settings.update";

export const TEAM_ROLES = [
  "owner",
  "admin",
  "manager",
  "cashier",
  "kitchen",
  "waiter",
  "marketing",
  "viewer",
] as const satisfies readonly TeamRole[];

export const TEAM_PERMISSIONS = [
  "team.read",
  "team.invite",
  "team.update",
  "team.remove",
  "menu.read",
  "menu.update",
  "orders.read",
  "orders.create",
  "orders.update",
  "orders.cancel",
  "payments.read",
  "payments.create",
  "kitchen.read",
  "kitchen.update",
  "reservations.read",
  "reservations.update",
  "customers.read",
  "customers.update",
  "marketing.read",
  "marketing.update",
  "whatsapp.read",
  "whatsapp.update",
  "analytics.read",
  "settings.read",
  "settings.update",
] as const satisfies readonly TeamPermission[];

const ALL_TEAM_PERMISSIONS: readonly TeamPermission[] = TEAM_PERMISSIONS;

const READ_ONLY_PERMISSIONS: readonly TeamPermission[] = [
  "team.read",
  "menu.read",
  "orders.read",
  "payments.read",
  "kitchen.read",
  "reservations.read",
  "customers.read",
  "marketing.read",
  "whatsapp.read",
  "analytics.read",
  "settings.read",
];

const MANAGER_PERMISSIONS: readonly TeamPermission[] = [
  ...READ_ONLY_PERMISSIONS,
  "team.invite",
  "orders.create",
  "orders.update",
  "orders.cancel",
  "payments.create",
  "kitchen.update",
  "reservations.update",
  "customers.update",
  "marketing.read",
  "whatsapp.read",
  "whatsapp.update",
  "settings.read",
];

const ADMIN_PERMISSIONS: readonly TeamPermission[] = ALL_TEAM_PERMISSIONS.filter(
  (permission) => permission !== "team.remove",
);

export const TEAM_ROLE_DEFINITIONS: ReadonlyArray<{
  slug: TeamRole;
  name: string;
  description: string;
  permissions: readonly TeamPermission[];
}> = [
  {
    slug: "owner",
    name: "Owner",
    description: "Full control, billing, and organization management",
    permissions: ALL_TEAM_PERMISSIONS,
  },
  {
    slug: "admin",
    name: "Admin",
    description: "General administration without destructive ownership actions",
    permissions: ADMIN_PERMISSIONS,
  },
  {
    slug: "manager",
    name: "Manager",
    description: "Restaurant operations and team coordination",
    permissions: MANAGER_PERMISSIONS,
  },
  {
    slug: "cashier",
    name: "Cashier",
    description: "POS, payments, and order handling",
    permissions: [
      "orders.read",
      "orders.create",
      "orders.update",
      "orders.cancel",
      "payments.read",
      "payments.create",
      "customers.read",
      "whatsapp.read",
      "whatsapp.update",
      "settings.read",
    ],
  },
  {
    slug: "kitchen",
    name: "Kitchen",
    description: "Kitchen preparation and order status",
    permissions: ["kitchen.read", "kitchen.update", "orders.read"],
  },
  {
    slug: "waiter",
    name: "Waiter",
    description: "Tables, orders, and reservations",
    permissions: [
      "orders.read",
      "orders.create",
      "orders.update",
      "reservations.read",
      "reservations.update",
      "customers.read",
      "whatsapp.read",
      "whatsapp.update",
    ],
  },
  {
    slug: "marketing",
    name: "Marketing",
    description: "CRM, campaigns, and marketing channels",
    permissions: [
      "customers.read",
      "customers.update",
      "marketing.read",
      "marketing.update",
      "whatsapp.read",
      "whatsapp.update",
      "analytics.read",
    ],
  },
  {
    slug: "viewer",
    name: "Viewer",
    description: "Read-only access to operational data",
    permissions: READ_ONLY_PERMISSIONS,
  },
];

export const TEAM_ROLE_RANK: Record<TeamRole, number> = {
  owner: 100,
  admin: 90,
  manager: 80,
  cashier: 50,
  kitchen: 50,
  waiter: 50,
  marketing: 50,
  viewer: 10,
};

/** Legacy slug still present in older organizations. */
export const LEGACY_STAFF_ROLE_SLUG = "staff" as const;

export const LEGACY_STAFF_RANK = 45;

export function isTeamRole(value: string): value is TeamRole {
  return (TEAM_ROLES as readonly string[]).includes(value);
}

export function getRoleRank(role: TeamRole | typeof LEGACY_STAFF_ROLE_SLUG): number {
  if (role === LEGACY_STAFF_ROLE_SLUG) {
    return LEGACY_STAFF_RANK;
  }

  return TEAM_ROLE_RANK[role];
}

export function canAssignRole(
  actorRole: TeamRole | typeof LEGACY_STAFF_ROLE_SLUG,
  targetRole: TeamRole,
): boolean {
  if (actorRole === LEGACY_STAFF_ROLE_SLUG) {
    return false;
  }

  if (actorRole === "owner") {
    return true;
  }

  if (actorRole === "admin") {
    return targetRole !== "owner";
  }

  if (actorRole === "manager") {
    return getRoleRank(targetRole) <= TEAM_ROLE_RANK.manager;
  }

  return false;
}

export function getPermissionsForRole(role: TeamRole): TeamPermission[] {
  const definition = TEAM_ROLE_DEFINITIONS.find((item) => item.slug === role);
  return definition ? [...definition.permissions] : [];
}

export function resolveMemberPermissions(
  role: TeamRole | typeof LEGACY_STAFF_ROLE_SLUG,
  customPermissions: TeamPermission[] | null,
): TeamPermission[] {
  if (customPermissions && customPermissions.length > 0) {
    return customPermissions;
  }

  if (role === LEGACY_STAFF_ROLE_SLUG) {
    return getPermissionsForRole("waiter");
  }

  if (isTeamRole(role)) {
    return getPermissionsForRole(role);
  }

  return getPermissionsForRole("viewer");
}

export function actorCanInvite(
  actorRole: TeamRole | typeof LEGACY_STAFF_ROLE_SLUG,
  permissions: readonly TeamPermission[],
): boolean {
  if (actorRole === "owner" || actorRole === "admin") {
    return true;
  }

  return permissions.includes("team.invite");
}

export function actorCanUpdate(
  actorRole: TeamRole | typeof LEGACY_STAFF_ROLE_SLUG,
  permissions: readonly TeamPermission[],
): boolean {
  if (actorRole === "owner" || actorRole === "admin") {
    return true;
  }

  return permissions.includes("team.update");
}

export function actorCanRemove(
  actorRole: TeamRole | typeof LEGACY_STAFF_ROLE_SLUG,
  permissions: readonly TeamPermission[],
): boolean {
  if (actorRole === "owner") {
    return true;
  }

  return permissions.includes("team.remove");
}

const TEAM_TO_RBAC_PERMISSION: Record<TeamPermission, PermissionKey | null> = {
  "team.read": PERMISSIONS.STAFF_READ,
  "team.invite": PERMISSIONS.STAFF_WRITE,
  "team.update": PERMISSIONS.STAFF_WRITE,
  "team.remove": PERMISSIONS.STAFF_WRITE,
  "menu.read": PERMISSIONS.MENU_READ,
  "menu.update": PERMISSIONS.MENU_WRITE,
  "orders.read": PERMISSIONS.ORDERS_READ,
  "orders.create": PERMISSIONS.ORDERS_WRITE,
  "orders.update": PERMISSIONS.ORDERS_WRITE,
  "orders.cancel": PERMISSIONS.ORDERS_WRITE,
  "payments.read": PERMISSIONS.ORDERS_READ,
  "payments.create": PERMISSIONS.ORDERS_WRITE,
  "kitchen.read": PERMISSIONS.ORDERS_READ,
  "kitchen.update": PERMISSIONS.ORDERS_WRITE,
  "reservations.read": PERMISSIONS.RESERVATIONS_READ,
  "reservations.update": PERMISSIONS.RESERVATIONS_WRITE,
  "customers.read": PERMISSIONS.CUSTOMERS_READ,
  "customers.update": PERMISSIONS.CUSTOMERS_WRITE,
  "marketing.read": PERMISSIONS.MARKETING_READ,
  "marketing.update": PERMISSIONS.MARKETING_WRITE,
  "whatsapp.read": PERMISSIONS.WHATSAPP_READ,
  "whatsapp.update": PERMISSIONS.WHATSAPP_WRITE,
  "analytics.read": PERMISSIONS.ANALYTICS_READ,
  "settings.read": PERMISSIONS.SETTINGS_READ,
  "settings.update": PERMISSIONS.SETTINGS_WRITE,
};

export function teamPermissionsToRbacKeys(
  permissions: readonly TeamPermission[],
): PermissionKey[] {
  const keys = new Set<PermissionKey>();

  for (const permission of permissions) {
    const mapped = TEAM_TO_RBAC_PERMISSION[permission];

    if (mapped) {
      keys.add(mapped);
    }
  }

  return Array.from(keys);
}
