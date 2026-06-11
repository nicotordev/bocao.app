import type { TeamRole } from "@/lib/team/permissions";

export type TeamLabels = {
  header: {
    title: string;
    subtitle: string;
  };
  actions: {
    inviteMember: string;
    viewPermissions: string;
    editRole: string;
    editPermissions: string;
    assignRestaurants: string;
    removeMember: string;
    resendInvitation: string;
    cancelInvitation: string;
    sendInvitation: string;
    save: string;
    cancel: string;
  };
  kpis: {
    activeMembers: string;
    pendingInvitations: string;
    managers: string;
    kitchenStaff: string;
    cashiers: string;
    inactiveMembers: string;
  };
  table: {
    user: string;
    email: string;
    role: string;
    restaurants: string;
    status: string;
    lastActivity: string;
    joinedAt: string;
    actions: string;
  };
  invitations: {
    title: string;
    description: string;
    email: string;
    role: string;
    restaurant: string;
    invitedBy: string;
    expiresAt: string;
    status: string;
    empty: string;
  };
  dialogs: {
    inviteTitle: string;
    inviteDescription: string;
    editRoleTitle: string;
    editRoleDescription: string;
    permissionsTitle: string;
    permissionsDescription: string;
    removeTitle: string;
    removeDescription: string;
    email: string;
    role: string;
    restaurants: string;
    customPermissions: string;
    allRestaurants: string;
  };
  roles: Record<TeamRole | "staff", string>;
  statuses: {
    active: string;
    inactive: string;
    removed: string;
    pending: string;
    expired: string;
    revoked: string;
  };
  permissions: Record<string, string>;
  empty: {
    title: string;
    description: string;
    cta: string;
  };
  feedback: {
    inviteSuccess: string;
    inviteError: string;
    updateSuccess: string;
    updateError: string;
    removeSuccess: string;
    removeError: string;
    resendSuccess: string;
    resendError: string;
    cancelSuccess: string;
    cancelError: string;
  };
  activity: {
    title: string;
    description: string;
    comingSoon: string;
  };
};
