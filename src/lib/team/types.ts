import type { TeamPermission, TeamRole } from "@/lib/team/permissions";

export type MembershipStatus = "active" | "inactive" | "removed";

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type TeamRestaurantRef = {
  id: string;
  name: string;
};

export type TeamMemberView = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TeamRole | "staff";
  restaurants: TeamRestaurantRef[];
  status: MembershipStatus;
  lastActivity: string | null;
  joinedAt: string;
  customPermissions: TeamPermission[] | null;
};

export type TeamInvitationView = {
  id: string;
  email: string;
  role: TeamRole;
  restaurant: TeamRestaurantRef | null;
  invitedBy: { id: string; name: string } | null;
  expiresAt: string;
  status: InvitationStatus;
  createdAt: string;
};

export type TeamSummary = {
  activeMembers: number;
  pendingInvitations: number;
  managers: number;
  kitchenStaff: number;
  cashiers: number;
  inactiveMembers: number;
};

export type TeamActorPermissions = {
  canInvite: boolean;
  canUpdate: boolean;
  canRemove: boolean;
  canManagePermissions: boolean;
  actorRole: TeamRole | "staff";
  actorUserId: string;
};

export type TeamPageData = {
  summary: TeamSummary;
  members: TeamMemberView[];
  invitations: TeamInvitationView[];
  restaurants: TeamRestaurantRef[];
  permissions: TeamActorPermissions;
};

export type TeamEvent =
  | "team.member.invited"
  | "team.member.joined"
  | "team.member.role.updated"
  | "team.member.permissions.updated"
  | "team.member.removed"
  | "team.invitation.cancelled"
  | "team.invitation.resent";

export type InviteMemberResult = {
  invitation: TeamInvitationView;
  acceptUrl: string;
};

export type UpdateMemberResult = {
  member: TeamMemberView;
};
