import { getDashboardContext } from "@/lib/dashboard/context";
import { PERMISSIONS } from "@/lib/rbac/permissions";

export async function requireOrganizationCustomerTagsAccess(
  organizationId: string,
) {
  const context = await getDashboardContext();

  if (!context) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  if (context.organization.id !== organizationId) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  const canRead = context.membership.permissions.includes(
    PERMISSIONS.CUSTOMERS_READ,
  );

  if (!canRead) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return { ok: true as const, context };
}

export async function requireOrganizationCustomerTagsWriteAccess(
  organizationId: string,
) {
  const access = await requireOrganizationCustomerTagsAccess(organizationId);

  if (!access.ok) {
    return access;
  }

  const canWrite = access.context.membership.permissions.includes(
    PERMISSIONS.CUSTOMERS_WRITE,
  );

  if (!canWrite) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }

  return access;
}
