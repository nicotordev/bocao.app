import type { InviteMemberBody, UpdateMemberBody } from "@/lib/team/schema";
import type {
  InviteMemberResult,
  TeamPageData,
  UpdateMemberResult,
} from "@/lib/team/types";
import { apiRequest } from "@/lib/query/api-client";

export async function fetchTeamPageData(): Promise<TeamPageData> {
  return apiRequest<TeamPageData>("/api/team/members");
}

export async function inviteTeamMember(
  body: InviteMemberBody,
): Promise<InviteMemberResult> {
  return apiRequest<InviteMemberResult>("/api/team/invitations", {
    method: "POST",
    body,
  });
}

export async function updateTeamMember(
  membershipId: string,
  body: UpdateMemberBody,
): Promise<UpdateMemberResult> {
  return apiRequest<UpdateMemberResult>(`/api/team/members/${membershipId}`, {
    method: "PATCH",
    body,
  });
}

export async function removeTeamMember(membershipId: string): Promise<void> {
  return apiRequest<void>(`/api/team/members/${membershipId}`, {
    method: "DELETE",
  });
}

export async function resendTeamInvitation(
  invitationId: string,
): Promise<{ acceptUrl: string }> {
  return apiRequest<{ acceptUrl: string }>(
    `/api/team/invitations/${invitationId}/resend`,
    { method: "POST" },
  );
}

export async function cancelTeamInvitation(
  invitationId: string,
): Promise<void> {
  return apiRequest<void>(`/api/team/invitations/${invitationId}`, {
    method: "DELETE",
  });
}
