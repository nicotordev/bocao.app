import type { PermissionKey, SystemRoleSlug } from "@/lib/rbac/permissions";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export type NavItemId =
  | "dashboard"
  | "orders"
  | "reservations"
  | "floorPlan"
  | "whatsapp"
  | "menu"
  | "kitchen"
  | "kitchenBoard"
  | "kitchenStations"
  | "customers"
  | "marketing"
  | "analytics"
  | "team"
  | "settings";

export type NavChildItem = {
  id: NavItemId;
  label: string;
  href: string;
};

export type NavItemIcon = Exclude<NavItemId, "kitchenBoard" | "kitchenStations">;

export type NavItemGroup =
  | "inicio"
  | "operaciones"
  | "clientes"
  | "administracion";

export type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
  icon: NavItemIcon;
  group: NavItemGroup;
  permission: PermissionKey | null;
  allowedRoles?: readonly SystemRoleSlug[];
  children?: readonly NavChildItem[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    group: "inicio",
    permission: null,
  },
  {
    id: "orders",
    label: "Pedidos",
    href: "/dashboard/orders",
    icon: "orders",
    group: "operaciones",
    permission: PERMISSIONS.ORDERS_READ,
  },
  {
    id: "reservations",
    label: "Reservas",
    href: "/dashboard/reservations",
    icon: "reservations",
    group: "operaciones",
    permission: PERMISSIONS.RESERVATIONS_READ,
  },
  {
    id: "floorPlan",
    label: "Plano de mesas",
    href: "/dashboard/floor-plan",
    icon: "floorPlan",
    group: "operaciones",
    permission: PERMISSIONS.ORDERS_READ,
  },
  {
    id: "whatsapp",
    label: "WhatsApp Inbox",
    href: "/dashboard/whatsapp/inbox",
    icon: "whatsapp",
    group: "clientes",
    permission: PERMISSIONS.WHATSAPP_READ,
  },
  {
    id: "menu",
    label: "Menú",
    href: "/dashboard/menu",
    icon: "menu",
    group: "operaciones",
    permission: PERMISSIONS.MENU_READ,
  },
  {
    id: "kitchen",
    label: "Cocina",
    href: "/dashboard/kitchen",
    icon: "kitchen",
    group: "operaciones",
    permission: PERMISSIONS.ORDERS_READ,
    allowedRoles: ["owner", "manager", "staff"],
    children: [
      {
        id: "kitchenBoard",
        label: "Vista de cocina",
        href: "/dashboard/kitchen",
      },
      {
        id: "kitchenStations",
        label: "Estaciones",
        href: "/dashboard/kitchen/stations",
      },
    ],
  },
  {
    id: "customers",
    label: "Clientes / CRM",
    href: "/dashboard/customers",
    icon: "customers",
    group: "clientes",
    permission: PERMISSIONS.CUSTOMERS_READ,
  },
  {
    id: "marketing",
    label: "Marketing IA",
    href: "/dashboard/marketing/ai",
    icon: "marketing",
    group: "clientes",
    permission: PERMISSIONS.MARKETING_READ,
  },
  {
    id: "analytics",
    label: "Analítica",
    href: "/dashboard/analytics",
    icon: "analytics",
    group: "administracion",
    permission: PERMISSIONS.ANALYTICS_READ,
  },
  {
    id: "team",
    label: "Equipo",
    href: "/dashboard/team",
    icon: "team",
    group: "administracion",
    permission: PERMISSIONS.STAFF_READ,
  },
  {
    id: "settings",
    label: "Configuración",
    href: "/dashboard/settings",
    icon: "settings",
    group: "administracion",
    permission: PERMISSIONS.SETTINGS_READ,
  },
] as const;

export function getVisibleNavItems(
  permissions: readonly PermissionKey[],
  roleSlug: SystemRoleSlug,
): NavItem[] {
  const permissionSet = new Set(permissions);

  return NAV_ITEMS.filter((item) => {
    if (item.allowedRoles && !item.allowedRoles.includes(roleSlug)) {
      return false;
    }

    if (!item.permission) {
      return true;
    }

    return permissionSet.has(item.permission);
  });
}
