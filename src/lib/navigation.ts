import type { PermissionKey, SystemRoleSlug } from "@/lib/rbac/permissions";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import type { TablerIcon } from "@tabler/icons-react";
import {
  IconBrandWhatsapp,
  IconCalendarEvent,
  IconChartBar,
  IconChefHat,
  IconClipboardList,
  IconLayoutDashboard,
  IconSettings,
  IconSparkles,
  IconToolsKitchen2,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";

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
  icon: TablerIcon;
  permission: PermissionKey | null;
  allowedRoles?: readonly SystemRoleSlug[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: IconLayoutDashboard,
    permission: null,
  },
  {
    id: "orders",
    label: "Pedidos",
    href: "/dashboard/orders",
    icon: IconClipboardList,
    permission: PERMISSIONS.ORDERS_READ,
  },
  {
    id: "reservations",
    label: "Reservas",
    href: "/dashboard/reservations",
    icon: IconCalendarEvent,
    permission: PERMISSIONS.RESERVATIONS_READ,
  },
  {
    id: "whatsapp",
    label: "WhatsApp Inbox",
    href: "/dashboard/whatsapp",
    icon: IconBrandWhatsapp,
    permission: PERMISSIONS.WHATSAPP_READ,
  },
  {
    id: "menu",
    label: "Menú",
    href: "/dashboard/menu",
    icon: IconToolsKitchen2,
    permission: PERMISSIONS.MENU_READ,
  },
  {
    id: "kitchen",
    label: "Cocina",
    href: "/dashboard/kitchen",
    icon: IconChefHat,
    permission: PERMISSIONS.ORDERS_READ,
    allowedRoles: ["owner", "manager", "staff"],
  },
  {
    id: "customers",
    label: "Clientes / CRM",
    href: "/dashboard/customers",
    icon: IconUsers,
    permission: PERMISSIONS.CUSTOMERS_READ,
  },
  {
    id: "marketing",
    label: "Marketing IA",
    href: "/dashboard/marketing",
    icon: IconSparkles,
    permission: PERMISSIONS.MARKETING_READ,
  },
  {
    id: "analytics",
    label: "Analítica",
    href: "/dashboard/analytics",
    icon: IconChartBar,
    permission: PERMISSIONS.ANALYTICS_READ,
  },
  {
    id: "team",
    label: "Equipo",
    href: "/dashboard/team",
    icon: IconUsersGroup,
    permission: PERMISSIONS.STAFF_READ,
  },
  {
    id: "settings",
    label: "Configuración",
    href: "/dashboard/settings",
    icon: IconSettings,
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
