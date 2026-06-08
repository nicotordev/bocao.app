export const PERMISSIONS = {
  ORGANIZATION_READ: "organization:read",
  ORGANIZATION_WRITE: "organization:write",
  RESTAURANT_READ: "restaurant:read",
  RESTAURANT_WRITE: "restaurant:write",
  MENU_READ: "menu:read",
  MENU_WRITE: "menu:write",
  ORDERS_READ: "orders:read",
  ORDERS_WRITE: "orders:write",
  RESERVATIONS_READ: "reservations:read",
  RESERVATIONS_WRITE: "reservations:write",
  WHATSAPP_READ: "whatsapp:read",
  WHATSAPP_WRITE: "whatsapp:write",
  STAFF_READ: "staff:read",
  STAFF_WRITE: "staff:write",
  ROLES_READ: "roles:read",
  ROLES_WRITE: "roles:write",
  BILLING_READ: "billing:read",
  BILLING_MANAGE: "billing:manage",
  ANALYTICS_READ: "analytics:read",
  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_WRITE: "customers:write",
  MARKETING_READ: "marketing:read",
  MARKETING_WRITE: "marketing:write",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const SYSTEM_ROLE_SLUGS = {
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
} as const;

export type SystemRoleSlug =
  (typeof SYSTEM_ROLE_SLUGS)[keyof typeof SYSTEM_ROLE_SLUGS];

export const PERMISSION_CATALOG: ReadonlyArray<{
  key: PermissionKey;
  module: string;
  description: string;
}> = [
  {
    key: PERMISSIONS.ORGANIZATION_READ,
    module: "organization",
    description: "View organization profile",
  },
  {
    key: PERMISSIONS.ORGANIZATION_WRITE,
    module: "organization",
    description: "Edit organization profile",
  },
  {
    key: PERMISSIONS.RESTAURANT_READ,
    module: "restaurant",
    description: "View restaurant locations",
  },
  {
    key: PERMISSIONS.RESTAURANT_WRITE,
    module: "restaurant",
    description: "Create and edit restaurant locations",
  },
  {
    key: PERMISSIONS.MENU_READ,
    module: "menu",
    description: "View menu categories and items",
  },
  {
    key: PERMISSIONS.MENU_WRITE,
    module: "menu",
    description: "Create and edit menu",
  },
  {
    key: PERMISSIONS.ORDERS_READ,
    module: "orders",
    description: "View orders",
  },
  {
    key: PERMISSIONS.ORDERS_WRITE,
    module: "orders",
    description: "Create and update orders",
  },
  {
    key: PERMISSIONS.RESERVATIONS_READ,
    module: "reservations",
    description: "View reservations",
  },
  {
    key: PERMISSIONS.RESERVATIONS_WRITE,
    module: "reservations",
    description: "Create and manage reservations",
  },
  {
    key: PERMISSIONS.WHATSAPP_READ,
    module: "whatsapp",
    description: "View WhatsApp conversations",
  },
  {
    key: PERMISSIONS.WHATSAPP_WRITE,
    module: "whatsapp",
    description: "Reply and manage WhatsApp conversations",
  },
  {
    key: PERMISSIONS.STAFF_READ,
    module: "staff",
    description: "View team members",
  },
  {
    key: PERMISSIONS.STAFF_WRITE,
    module: "staff",
    description: "Invite and manage team members",
  },
  {
    key: PERMISSIONS.ROLES_READ,
    module: "roles",
    description: "View roles and permissions",
  },
  {
    key: PERMISSIONS.ROLES_WRITE,
    module: "roles",
    description: "Create and edit custom roles",
  },
  {
    key: PERMISSIONS.BILLING_READ,
    module: "billing",
    description: "View billing and subscription",
  },
  {
    key: PERMISSIONS.BILLING_MANAGE,
    module: "billing",
    description: "Manage billing and subscription",
  },
  {
    key: PERMISSIONS.ANALYTICS_READ,
    module: "analytics",
    description: "View analytics and reports",
  },
  {
    key: PERMISSIONS.CUSTOMERS_READ,
    module: "customers",
    description: "View customer profiles and CRM data",
  },
  {
    key: PERMISSIONS.CUSTOMERS_WRITE,
    module: "customers",
    description: "Create and edit customer profiles",
  },
  {
    key: PERMISSIONS.MARKETING_READ,
    module: "marketing",
    description: "View AI marketing campaigns and content",
  },
  {
    key: PERMISSIONS.MARKETING_WRITE,
    module: "marketing",
    description: "Create and manage AI marketing campaigns",
  },
  {
    key: PERMISSIONS.SETTINGS_READ,
    module: "settings",
    description: "View app settings",
  },
  {
    key: PERMISSIONS.SETTINGS_WRITE,
    module: "settings",
    description: "Edit app settings",
  },
];

const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.map(
  (permission) => permission.key,
);

export const SYSTEM_ROLE_DEFINITIONS: ReadonlyArray<{
  slug: SystemRoleSlug;
  name: string;
  description: string;
  permissions: readonly PermissionKey[];
}> = [
  {
    slug: SYSTEM_ROLE_SLUGS.OWNER,
    name: "Owner",
    description: "Full access to the organization",
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    slug: SYSTEM_ROLE_SLUGS.MANAGER,
    name: "Manager",
    description:
      "Manage daily operations without billing or role administration",
    permissions: ALL_PERMISSION_KEYS.filter(
      (key) =>
        key !== PERMISSIONS.BILLING_MANAGE &&
        key !== PERMISSIONS.ROLES_WRITE &&
        key !== PERMISSIONS.STAFF_WRITE,
    ),
  },
  {
    slug: SYSTEM_ROLE_SLUGS.STAFF,
    name: "Staff",
    description: "Handle orders, reservations, and customer conversations",
    permissions: [
      PERMISSIONS.RESTAURANT_READ,
      PERMISSIONS.MENU_READ,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_WRITE,
      PERMISSIONS.RESERVATIONS_READ,
      PERMISSIONS.RESERVATIONS_WRITE,
      PERMISSIONS.WHATSAPP_READ,
      PERMISSIONS.WHATSAPP_WRITE,
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.SETTINGS_READ,
    ],
  },
];
