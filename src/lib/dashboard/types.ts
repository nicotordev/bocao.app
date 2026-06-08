import type { PermissionKey, SystemRoleSlug } from "@/lib/rbac/permissions";
import type { NavItem } from "@/lib/navigation";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

export type DashboardRestaurant = {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  organizationId: string;
};

export type DashboardOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type DashboardMembership = {
  id: string;
  roleSlug: SystemRoleSlug;
  roleName: string;
  permissions: PermissionKey[];
};

export type DashboardContext = {
  user: DashboardUser;
  organization: DashboardOrganization;
  restaurants: DashboardRestaurant[];
  activeRestaurant: DashboardRestaurant | null;
  membership: DashboardMembership;
  navigation: NavItem[];
};
