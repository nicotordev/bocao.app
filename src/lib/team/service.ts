import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type { DashboardContext } from "@/lib/dashboard/types";
import { sendTeamInvitationEmail } from "@/lib/email/send-team-invitation";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { recordTeamEventInTx } from "@/lib/team/events";
import {
  actorCanInvite,
  actorCanRemove,
  actorCanUpdate,
  canAssignRole,
  isTeamRole,
  resolveMemberPermissions,
  type TeamRole,
} from "@/lib/team/permissions";
import {
  countOwnersInOrganization,
  ensureTeamRolesForOrganization,
  findActiveMemberByEmail,
  findMembershipById,
  findPendingInvitationByEmail,
  findRoleIdBySlug,
  getRestaurantNamesByIds,
  listOrganizationMembers,
  listOrganizationRestaurants,
  listPendingInvitations,
  mapInvitationStatus,
  mapMembershipStatus,
  parseCustomPermissions,
  resolveDisplayRole,
  syncRestaurantMemberships,
} from "@/lib/team/repository";
import type {
  InviteMemberBody,
  UpdateMemberBody,
} from "@/lib/team/schema";
import {
  buildInvitationAcceptUrl,
  generateInvitationToken,
  getInvitationExpiryDate,
} from "@/lib/team/tokens";
import type {
  InviteMemberResult,
  TeamInvitationView,
  TeamMemberView,
  TeamPageData,
  UpdateMemberResult,
} from "@/lib/team/types";

export class TeamServiceError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status = 400) {
    super(message);
    this.name = "TeamServiceError";
    this.code = code;
    this.status = status;
  }
}

function requireOrganizationContext(context: DashboardContext) {
  return {
    organizationId: context.organization.id,
    organizationName: context.organization.name,
    actorMembershipId: context.membership.id,
    actorUserId: context.user.id,
    actorRole: resolveDisplayRole(context.membership.roleSlug),
    actorPermissions: resolveMemberPermissions(
      resolveDisplayRole(context.membership.roleSlug),
      null,
    ),
  };
}

function assertTeamReadAccess(context: DashboardContext) {
  const canRead = context.membership.permissions.includes(
    PERMISSIONS.STAFF_READ,
  );

  if (!canRead) {
    throw new TeamServiceError("Forbidden", "FORBIDDEN", 403);
  }
}

function mapMemberView(
  member: Awaited<ReturnType<typeof listOrganizationMembers>>[number],
  restaurantNames: Map<string, string>,
): TeamMemberView {
  const restaurantIds = member.restaurantMemberships.map(
    (item) => item.restaurantId,
  );

  const lastSession = member.user.sessions[0];

  return {
    id: member.id,
    userId: member.user.id,
    name: member.user.name,
    email: member.user.email,
    role: resolveDisplayRole(member.role.slug),
    restaurants: restaurantIds
      .map((id) => {
        const name = restaurantNames.get(id);
        return name ? { id, name } : null;
      })
      .filter((item): item is { id: string; name: string } => item !== null),
    status: mapMembershipStatus(member.status),
    lastActivity: lastSession?.updatedAt.toISOString() ?? null,
    joinedAt: member.createdAt.toISOString(),
    customPermissions: parseCustomPermissions(member.customPermissions),
  };
}

async function mapInvitationViews(
  organizationId: string,
  invitations: Awaited<ReturnType<typeof listPendingInvitations>>,
): Promise<TeamInvitationView[]> {
  const restaurantIds = invitations
    .map((invitation) => invitation.restaurantId)
    .filter((id): id is string => id !== null);

  const restaurantNames = await getRestaurantNamesByIds(
    organizationId,
    restaurantIds,
  );

  return invitations.map((invitation) => ({
    id: invitation.id,
    email: invitation.email,
    role: isTeamRole(invitation.role) ? invitation.role : "viewer",
    restaurant: invitation.restaurantId
      ? {
          id: invitation.restaurantId,
          name:
            restaurantNames.get(invitation.restaurantId) ??
            invitation.restaurantId,
        }
      : null,
    invitedBy: invitation.invitedBy
      ? {
          id: invitation.invitedBy.id,
          name: invitation.invitedBy.user.name,
        }
      : null,
    expiresAt: invitation.expiresAt.toISOString(),
    status: mapInvitationStatus(invitation.status, invitation.expiresAt),
    createdAt: invitation.createdAt.toISOString(),
  }));
}

export async function getTeamPageData(
  context: DashboardContext,
): Promise<TeamPageData> {
  assertTeamReadAccess(context);

  const { organizationId, actorRole, actorUserId } =
    requireOrganizationContext(context);

  await ensureTeamRolesForOrganization(organizationId);

  const [members, invitations, restaurants] = await Promise.all([
    listOrganizationMembers(organizationId),
    listPendingInvitations(organizationId),
    listOrganizationRestaurants(organizationId),
  ]);

  const allRestaurantIds = [
    ...new Set(
      members.flatMap((member) =>
        member.restaurantMemberships.map((item) => item.restaurantId),
      ),
    ),
  ];

  const restaurantNames = await getRestaurantNamesByIds(
    organizationId,
    allRestaurantIds,
  );

  const memberViews = members.map((member) =>
    mapMemberView(member, restaurantNames),
  );

  const actorPermissions = resolveMemberPermissions(actorRole, null);

  return {
    summary: {
      activeMembers: memberViews.filter((member) => member.status === "active")
        .length,
      pendingInvitations: invitations.length,
      managers: memberViews.filter(
        (member) =>
          member.status === "active" &&
          (member.role === "manager" || member.role === "admin"),
      ).length,
      kitchenStaff: memberViews.filter(
        (member) => member.status === "active" && member.role === "kitchen",
      ).length,
      cashiers: memberViews.filter(
        (member) => member.status === "active" && member.role === "cashier",
      ).length,
      inactiveMembers: memberViews.filter(
        (member) => member.status !== "active",
      ).length,
    },
    members: memberViews,
    invitations: await mapInvitationViews(organizationId, invitations),
    restaurants,
    permissions: {
      canInvite: actorCanInvite(actorRole, actorPermissions),
      canUpdate: actorCanUpdate(actorRole, actorPermissions),
      canRemove: actorCanRemove(actorRole, actorPermissions),
      canManagePermissions:
        actorRole === "owner" || actorRole === "admin",
      actorRole,
      actorUserId,
    },
  };
}

export async function inviteTeamMember(
  context: DashboardContext,
  input: InviteMemberBody,
): Promise<InviteMemberResult> {
  assertTeamReadAccess(context);

  const {
    organizationId,
    organizationName,
    actorMembershipId,
    actorRole,
    actorPermissions,
  } = requireOrganizationContext(context);

  if (!actorCanInvite(actorRole, actorPermissions)) {
    throw new TeamServiceError("Forbidden", "FORBIDDEN", 403);
  }

  if (!canAssignRole(actorRole, input.role)) {
    throw new TeamServiceError(
      "Cannot invite with a role above your own",
      "ROLE_NOT_ALLOWED",
      403,
    );
  }

  const email = input.email.toLowerCase();

  const [existingMember, existingInvitation] = await Promise.all([
    findActiveMemberByEmail(organizationId, email),
    findPendingInvitationByEmail(organizationId, email),
  ]);

  if (existingMember) {
    throw new TeamServiceError(
      "A member with this email already exists",
      "MEMBER_EXISTS",
      409,
    );
  }

  if (existingInvitation) {
    throw new TeamServiceError(
      "A pending invitation already exists for this email",
      "INVITATION_EXISTS",
      409,
    );
  }

  if (input.restaurantIds && input.restaurantIds.length > 0) {
    const validRestaurants = await listOrganizationRestaurants(organizationId);
    const validIds = new Set(validRestaurants.map((restaurant) => restaurant.id));

    const invalid = input.restaurantIds.some((id) => !validIds.has(id));

    if (invalid) {
      throw new TeamServiceError(
        "One or more restaurants are invalid",
        "INVALID_RESTAURANTS",
        400,
      );
    }
  }

  await ensureTeamRolesForOrganization(organizationId);

  const { token, tokenHash } = generateInvitationToken();
  const expiresAt = getInvitationExpiryDate();

  const invitation = await prisma.$transaction(async (tx) => {
    const created = await tx.teamInvitation.create({
      data: {
        organizationId,
        restaurantId: input.restaurantIds?.[0] ?? null,
        email,
        role: input.role,
        permissions: input.customPermissions ?? undefined,
        tokenHash,
        expiresAt,
        invitedById: actorMembershipId,
      },
    });

    await recordTeamEventInTx(tx, {
      organizationId,
      restaurantId: input.restaurantIds?.[0] ?? null,
      type: "team.member.invited",
      payload: {
        invitationId: created.id,
        email,
        role: input.role,
      },
    });

    return created;
  });

  const acceptUrl = buildInvitationAcceptUrl(token);

  try {
    await sendTeamInvitationEmail({
      email,
      organizationName,
      role: input.role,
      acceptUrl,
    });
  } catch (error) {
    console.error("[team] failed to send invitation email", error);
  }

  const [invitationViews] = await Promise.all([
    mapInvitationViews(organizationId, [
      {
        ...invitation,
        invitedBy: {
          id: actorMembershipId,
          user: { name: context.user.name },
        },
      },
    ]),
  ]);

  return {
    invitation: invitationViews[0]!,
    acceptUrl,
  };
}

export async function updateTeamMember(
  context: DashboardContext,
  membershipId: string,
  input: UpdateMemberBody,
): Promise<UpdateMemberResult> {
  assertTeamReadAccess(context);

  const {
    organizationId,
    actorRole,
    actorPermissions,
    actorUserId,
  } = requireOrganizationContext(context);

  if (!actorCanUpdate(actorRole, actorPermissions)) {
    throw new TeamServiceError("Forbidden", "FORBIDDEN", 403);
  }

  const member = await findMembershipById(membershipId, organizationId);

  if (!member) {
    throw new TeamServiceError("Member not found", "NOT_FOUND", 404);
  }

  const currentRole = resolveDisplayRole(member.role.slug);

  if (input.role && !canAssignRole(actorRole, input.role)) {
    throw new TeamServiceError(
      "Cannot assign a role above your own",
      "ROLE_NOT_ALLOWED",
      403,
    );
  }

  if (input.role) {
    const owners = await countOwnersInOrganization(organizationId);
    const isLastOwner =
      currentRole === "owner" && owners <= 1 && input.role !== "owner";

    if (isLastOwner) {
      throw new TeamServiceError(
        "Cannot change role of the last owner",
        "LAST_OWNER",
        409,
      );
    }

    if (
      member.userId === actorUserId &&
      currentRole === "owner" &&
      input.role !== "owner"
    ) {
      const ownersAfter = owners - 1;

      if (ownersAfter < 1) {
        throw new TeamServiceError(
          "Cannot demote yourself as the last owner",
          "LAST_OWNER",
          409,
        );
      }
    }
  }

  if (input.restaurantIds) {
    const validRestaurants = await listOrganizationRestaurants(organizationId);
    const validIds = new Set(validRestaurants.map((restaurant) => restaurant.id));
    const invalid = input.restaurantIds.some((id) => !validIds.has(id));

    if (invalid) {
      throw new TeamServiceError(
        "One or more restaurants are invalid",
        "INVALID_RESTAURANTS",
        400,
      );
    }
  }

  await ensureTeamRolesForOrganization(organizationId);

  let roleId: string | undefined;

  if (input.role) {
    const resolvedRoleId = await findRoleIdBySlug(organizationId, input.role);

    if (!resolvedRoleId) {
      throw new TeamServiceError("Role not found", "ROLE_NOT_FOUND", 404);
    }

    roleId = resolvedRoleId;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Prisma.MembershipUncheckedUpdateInput = {};

    if (roleId) {
      updateData.roleId = roleId;
    }

    if (input.status) {
      updateData.status = input.status;
    }

    if (input.customPermissions !== undefined) {
      updateData.customPermissions =
        input.customPermissions === null
          ? Prisma.JsonNull
          : input.customPermissions;
    }

    await tx.membership.update({
      where: { id: membershipId },
      data: updateData,
    });

    if (input.restaurantIds) {
      const current = await tx.membership.findUniqueOrThrow({
        where: { id: membershipId },
        include: { role: { select: { slug: true } } },
      });

      await syncRestaurantMemberships(tx, {
        organizationId,
        membershipId,
        restaurantIds: input.restaurantIds,
        role:
          input.role ??
          (isTeamRole(current.role.slug) ? current.role.slug : null),
        permissions: input.customPermissions ?? null,
      });
    }

    const membership = await tx.membership.findUniqueOrThrow({
      where: { id: membershipId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            sessions: {
              select: { updatedAt: true },
              orderBy: { updatedAt: "desc" },
              take: 1,
            },
          },
        },
        role: { select: { id: true, slug: true, name: true } },
        restaurantMemberships: { select: { restaurantId: true } },
      },
    });

    const eventType =
      input.customPermissions !== undefined
        ? "team.member.permissions.updated"
        : "team.member.role.updated";

    await recordTeamEventInTx(tx, {
      organizationId,
      type: eventType,
      payload: {
        membershipId,
        role: input.role ?? membership.role.slug,
      },
    });

    return membership;
  });

  const restaurantIds = updated.restaurantMemberships.map(
    (item: { restaurantId: string }) => item.restaurantId,
  );
  const restaurantNames = await getRestaurantNamesByIds(
    organizationId,
    restaurantIds,
  );

  return {
    member: mapMemberView(updated, restaurantNames),
  };
}

export async function removeTeamMember(
  context: DashboardContext,
  membershipId: string,
): Promise<void> {
  assertTeamReadAccess(context);

  const {
    organizationId,
    actorRole,
    actorPermissions,
    actorUserId,
  } = requireOrganizationContext(context);

  if (!actorCanRemove(actorRole, actorPermissions)) {
    throw new TeamServiceError("Forbidden", "FORBIDDEN", 403);
  }

  const member = await findMembershipById(membershipId, organizationId);

  if (!member) {
    throw new TeamServiceError("Member not found", "NOT_FOUND", 404);
  }

  const currentRole = resolveDisplayRole(member.role.slug);

  if (currentRole === "owner") {
    const owners = await countOwnersInOrganization(organizationId);

    if (owners <= 1) {
      throw new TeamServiceError(
        "Cannot remove the last owner",
        "LAST_OWNER",
        409,
      );
    }
  }

  if (member.userId === actorUserId && currentRole === "owner") {
    throw new TeamServiceError(
      "Owners cannot remove themselves",
      "SELF_REMOVE_OWNER",
      409,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.membership.update({
      where: { id: membershipId },
      data: { status: "removed" },
    });

    await tx.restaurantMembership.deleteMany({
      where: { membershipId },
    });

    await recordTeamEventInTx(tx, {
      organizationId,
      type: "team.member.removed",
      payload: { membershipId },
    });
  });
}

export async function resendTeamInvitation(
  context: DashboardContext,
  invitationId: string,
): Promise<{ acceptUrl: string; invitation: TeamInvitationView }> {
  assertTeamReadAccess(context);

  const {
    organizationId,
    organizationName,
    actorRole,
    actorPermissions,
  } = requireOrganizationContext(context);

  if (!actorCanInvite(actorRole, actorPermissions)) {
    throw new TeamServiceError("Forbidden", "FORBIDDEN", 403);
  }

  const invitation = await prisma.teamInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
      status: "pending",
    },
    include: {
      invitedBy: {
        select: {
          id: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!invitation) {
    throw new TeamServiceError("Invitation not found", "NOT_FOUND", 404);
  }

  const { token, tokenHash } = generateInvitationToken();
  const expiresAt = getInvitationExpiryDate();
  const acceptUrl = buildInvitationAcceptUrl(token);

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.teamInvitation.update({
      where: { id: invitationId },
      data: {
        tokenHash,
        expiresAt,
        revokedAt: null,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    await recordTeamEventInTx(tx, {
      organizationId,
      restaurantId: row.restaurantId,
      type: "team.invitation.resent",
      payload: { invitationId },
    });

    return row;
  });

  try {
    await sendTeamInvitationEmail({
      email: updated.email,
      organizationName,
      role: isTeamRole(updated.role) ? updated.role : "viewer",
      acceptUrl,
    });
  } catch (error) {
    console.error("[team] failed to resend invitation email", error);
  }

  const [view] = await mapInvitationViews(organizationId, [updated]);

  return { acceptUrl, invitation: view! };
}

export async function cancelTeamInvitation(
  context: DashboardContext,
  invitationId: string,
): Promise<void> {
  assertTeamReadAccess(context);

  const { organizationId, actorRole, actorPermissions } =
    requireOrganizationContext(context);

  if (!actorCanInvite(actorRole, actorPermissions)) {
    throw new TeamServiceError("Forbidden", "FORBIDDEN", 403);
  }

  const invitation = await prisma.teamInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
      status: "pending",
    },
    select: { id: true },
  });

  if (!invitation) {
    throw new TeamServiceError("Invitation not found", "NOT_FOUND", 404);
  }

  await prisma.$transaction(async (tx) => {
    await tx.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status: "revoked",
        revokedAt: new Date(),
      },
    });

    await recordTeamEventInTx(tx, {
      organizationId,
      type: "team.invitation.cancelled",
      payload: { invitationId },
    });
  });
}

export async function assignMemberRestaurants(
  context: DashboardContext,
  membershipId: string,
  restaurantIds: string[],
  role?: TeamRole,
): Promise<UpdateMemberResult> {
  return updateTeamMember(context, membershipId, { restaurantIds, role });
}
