import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getLocale, getTranslations } from "next-intl/server";
import { TeamPageClient } from "@/components/dashboard/team/team-page-client";
import type { TeamLabels } from "@/components/dashboard/team/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { getQueryClient } from "@/lib/query/get-query-client";
import { teamPageQueryOptions } from "@/lib/query/team/team.queries";
import { getTeamPageData } from "@/lib/team/service";
import { TEAM_PERMISSION_MESSAGE_KEYS } from "@/lib/team/i18n";
import { TEAM_PERMISSIONS, TEAM_ROLES } from "@/lib/team/permissions";

export default async function TeamPage() {
  const t = await getTranslations("team");
  const locale = await getLocale();
  const context = await getDashboardContext();
  const organizationId = context?.organization.id ?? "";
  const queryClient = getQueryClient();

  if (context && organizationId) {
    await queryClient.prefetchQuery({
      ...teamPageQueryOptions(organizationId),
      queryFn: () => getTeamPageData(context),
    });
  }

  const roleLabels = Object.fromEntries(
    [...TEAM_ROLES, "staff" as const].map((role) => [role, t(`roles.${role}`)]),
  ) as TeamLabels["roles"];

  const permissionLabels = Object.fromEntries(
    TEAM_PERMISSIONS.map((permission) => [
      permission,
      t(TEAM_PERMISSION_MESSAGE_KEYS[permission]),
    ]),
  );

  const labels: TeamLabels = {
    header: {
      title: t("title"),
      subtitle: t("description"),
    },
    actions: {
      inviteMember: t("inviteMember"),
      viewPermissions: t("viewPermissions"),
      editRole: t("editRole"),
      editPermissions: t("editPermissions"),
      assignRestaurants: t("assignRestaurants"),
      removeMember: t("removeMember"),
      resendInvitation: t("resendInvitation"),
      cancelInvitation: t("cancelInvitation"),
      sendInvitation: t("sendInvitation"),
      save: t("save"),
      cancel: t("cancel"),
    },
    kpis: {
      activeMembers: t("activeMembers"),
      pendingInvitations: t("pendingInvitations"),
      managers: t("managers"),
      kitchenStaff: t("kitchenStaff"),
      cashiers: t("cashiers"),
      inactiveMembers: t("inactiveMembers"),
    },
    table: {
      user: t("table.user"),
      email: t("table.email"),
      role: t("role"),
      restaurants: t("restaurants"),
      status: t("status"),
      lastActivity: t("lastActivity"),
      joinedAt: t("joinedAt"),
      actions: t("actions"),
    },
    invitations: {
      title: t("invitations.title"),
      description: t("invitations.description"),
      email: t("email"),
      role: t("role"),
      restaurant: t("invitations.restaurant"),
      invitedBy: t("invitations.invitedBy"),
      expiresAt: t("invitations.expiresAt"),
      status: t("status"),
      empty: t("invitations.empty"),
    },
    dialogs: {
      inviteTitle: t("dialogs.inviteTitle"),
      inviteDescription: t("dialogs.inviteDescription"),
      editRoleTitle: t("dialogs.editRoleTitle"),
      editRoleDescription: t("dialogs.editRoleDescription"),
      permissionsTitle: t("dialogs.permissionsTitle"),
      permissionsDescription: t("dialogs.permissionsDescription"),
      removeTitle: t("dialogs.removeTitle"),
      removeDescription: t("dialogs.removeDescription"),
      email: t("email"),
      role: t("role"),
      restaurants: t("restaurants"),
      customPermissions: t("dialogs.customPermissions"),
      allRestaurants: t("dialogs.allRestaurants"),
    },
    roles: roleLabels,
    statuses: {
      active: t("statuses.active"),
      inactive: t("statuses.inactive"),
      removed: t("statuses.removed"),
      pending: t("statuses.pending"),
      expired: t("statuses.expired"),
      revoked: t("statuses.revoked"),
    },
    permissions: permissionLabels,
    empty: {
      title: t("emptyTitle"),
      description: t("emptyDescription"),
      cta: t("emptyCta"),
    },
    feedback: {
      inviteSuccess: t("feedback.inviteSuccess"),
      inviteError: t("feedback.inviteError"),
      updateSuccess: t("feedback.updateSuccess"),
      updateError: t("feedback.updateError"),
      removeSuccess: t("feedback.removeSuccess"),
      removeError: t("feedback.removeError"),
      resendSuccess: t("feedback.resendSuccess"),
      resendError: t("feedback.resendError"),
      cancelSuccess: t("feedback.cancelSuccess"),
      cancelError: t("feedback.cancelError"),
    },
    activity: {
      title: t("activity.title"),
      description: t("activity.description"),
      comingSoon: t("activity.comingSoon"),
    },
  };

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamPageClient
        labels={labels}
        organizationId={organizationId}
        locale={locale}
      />
    </HydrationBoundary>
  );
}
