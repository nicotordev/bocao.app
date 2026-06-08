import type { PermissionKey, SystemRoleSlug } from "@/lib/rbac/permissions";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export type NavItemId =
  | "dashboard"
  | "orders"
  | "reservations"
  | "whatsapp"
  | "menu"
  | "kitchen"
  | "customers"
  | "marketing"
  | "analytics"
  | "team"
  | "settings";

export type NavItem = {
  id: NavItemId;
  label: string;
  href: string;
  icon: NavItemId;
  permission: PermissionKey | null;
  allowedRoles?: readonly SystemRoleSlug[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    permission: null,
  },
  {
    id: "orders",
    label: "Pedidos",
    href: "/dashboard/orders",
    icon: "orders",
    permission: PERMISSIONS.ORDERS_READ,
  },
  {
    id: "reservations",
    label: "Reservas",
    href: "/dashboard/reservations",
    icon: "reservations",
    permission: PERMISSIONS.RESERVATIONS_READ,
  },
  {
    id: "whatsapp",
    label: "WhatsApp Inbox",
    href: "/dashboard/whatsapp",
    icon: "whatsapp",
    permission: PERMISSIONS.WHATSAPP_READ,
  },
  {
    id: "menu",
    label: "Menú",
    href: "/dashboard/menu",
    icon: "menu",
    permission: PERMISSIONS.MENU_READ,
  },
  {
    id: "kitchen",
    label: "Cocina",
    href: "/dashboard/kitchen",
    icon: "kitchen",
    permission: PERMISSIONS.ORDERS_READ,
    allowedRoles: ["owner", "manager", "staff"],
  },
  {
    id: "customers",
    label: "Clientes / CRM",
    href: "/dashboard/customers",
    icon: "customers",
    permission: PERMISSIONS.CUSTOMERS_READ,
  },
  {
    id: "marketing",
    label: "Marketing IA",
    href: "/dashboard/marketing",
    icon: "marketing",
    permission: PERMISSIONS.MARKETING_READ,
  },
  {
    id: "analytics",
    label: "Analítica",
    href: "/dashboard/analytics",
    icon: "analytics",
    permission: PERMISSIONS.ANALYTICS_READ,
  },
  {
    id: "team",
    label: "Equipo",
    href: "/dashboard/team",
    icon: "team",
    permission: PERMISSIONS.STAFF_READ,
  },
  {
    id: "settings",
    label: "Configuración",
    href: "/dashboard/settings",
    icon: "settings",
    permission: PERMISSIONS.SETTINGS_READ,
  },
] as const;

export function getVisibleNavItems(
  permissions: ReadonlySet<PermissionKey>,
  roleSlug: SystemRoleSlug,
): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.allowedRoles && !item.allowedRoles.includes(roleSlug)) {
      return false;
    }

    if (!item.permission) {
      return true;
    }

    return permissions.has(item.permission);
  });
}
