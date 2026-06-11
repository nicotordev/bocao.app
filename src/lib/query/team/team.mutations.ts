import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InviteMemberBody, UpdateMemberBody } from "@/lib/team/schema";
import {
  cancelTeamInvitation,
  inviteTeamMember,
  removeTeamMember,
  resendTeamInvitation,
  updateTeamMember,
} from "@/lib/query/team/team.api";
import { teamKeys } from "@/lib/query/team/team.keys";

function useInvalidateTeam(organizationId: string) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: teamKeys.members(organizationId),
    });
    void queryClient.invalidateQueries({
      queryKey: teamKeys.invitations(organizationId),
    });
  };
}

export function useInviteTeamMemberMutation(organizationId: string) {
  const invalidate = useInvalidateTeam(organizationId);

  return useMutation({
    mutationFn: (body: InviteMemberBody) => inviteTeamMember(body),
    onSuccess: invalidate,
  });
}

export function useUpdateTeamMemberMutation(organizationId: string) {
  const invalidate = useInvalidateTeam(organizationId);

  return useMutation({
    mutationFn: ({
      membershipId,
      body,
    }: {
      membershipId: string;
      body: UpdateMemberBody;
    }) => updateTeamMember(membershipId, body),
    onSuccess: invalidate,
  });
}

export function useRemoveTeamMemberMutation(organizationId: string) {
  const invalidate = useInvalidateTeam(organizationId);

  return useMutation({
    mutationFn: (membershipId: string) => removeTeamMember(membershipId),
    onSuccess: invalidate,
  });
}

export function useResendInvitationMutation(organizationId: string) {
  const invalidate = useInvalidateTeam(organizationId);

  return useMutation({
    mutationFn: (invitationId: string) => resendTeamInvitation(invitationId),
    onSuccess: invalidate,
  });
}

export function useCancelInvitationMutation(organizationId: string) {
  const invalidate = useInvalidateTeam(organizationId);

  return useMutation({
    mutationFn: (invitationId: string) => cancelTeamInvitation(invitationId),
    onSuccess: invalidate,
  });
}
