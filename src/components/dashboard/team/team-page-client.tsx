"use client";

import { useState } from "react";
import { TbShield, TbUserPlus } from "react-icons/tb";
import { toast } from "sonner";
import { QueryResultState } from "@/components/query/query-result-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/query/api-client";
import {
  useCancelInvitationMutation,
  useInviteTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useResendInvitationMutation,
  useUpdateTeamMemberMutation,
} from "@/lib/query/team/team.mutations";
import { useTeamPageQuery } from "@/lib/query/team/team.queries";
import type { TeamMemberView } from "@/lib/team/types";
import { EditMemberRoleDialog } from "./edit-member-role-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { MemberPermissionsDialog } from "./member-permissions-dialog";
import { PendingInvitationsCard } from "./pending-invitations-card";
import { TeamActivityCard } from "./team-activity-card";
import { TeamKpis } from "./team-kpis";
import { TeamMembersTable } from "./team-members-table";
import { TeamPermissionsReferenceDialog } from "./team-permissions-reference-dialog";
import type { TeamLabels } from "./types";

type TeamPageClientProps = {
  labels: TeamLabels;
  organizationId: string;
  locale: string;
};

function TeamLoadingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}

export function TeamPageClient({
  labels,
  organizationId,
  locale,
}: TeamPageClientProps) {
  const teamQuery = useTeamPageQuery(organizationId);
  const inviteMutation = useInviteTeamMemberMutation(organizationId);
  const updateMutation = useUpdateTeamMemberMutation(organizationId);
  const removeMutation = useRemoveTeamMemberMutation(organizationId);
  const resendMutation = useResendInvitationMutation(organizationId);
  const cancelMutation = useCancelInvitationMutation(organizationId);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMemberView | null>(null);
  const [permissionsMember, setPermissionsMember] =
    useState<TeamMemberView | null>(null);
  const [removeMember, setRemoveMember] = useState<TeamMemberView | null>(null);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const handleApiError = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) {
      toast.error(error.message);
      return;
    }

    toast.error(fallback);
  };

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
            {labels.header.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            {labels.header.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPermissionsOpen(true)}
          >
            <TbShield className="size-4" />
            {labels.actions.viewPermissions}
          </Button>
          {teamQuery.data?.permissions.canInvite ? (
            <Button type="button" onClick={() => setInviteOpen(true)}>
              <TbUserPlus className="size-4" />
              {labels.actions.inviteMember}
            </Button>
          ) : null}
        </div>
      </section>

      <QueryResultState
        query={teamQuery}
        loadingFallback={<TeamLoadingSkeleton />}
      >
        {(data) => (
          <>
            <TeamKpis summary={data.summary} labels={labels.kpis} />

            {data.members.length === 0 ? (
              <Empty className="border border-dashed border-border/70 bg-muted/10 py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TbUserPlus aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>{labels.empty.title}</EmptyTitle>
                  <EmptyDescription className="max-w-md">
                    {labels.empty.description}
                  </EmptyDescription>
                </EmptyHeader>
                {data.permissions.canInvite ? (
                  <Button type="button" onClick={() => setInviteOpen(true)}>
                    {labels.empty.cta}
                  </Button>
                ) : null}
              </Empty>
            ) : (
              <TeamMembersTable
                members={data.members}
                labels={labels}
                locale={locale}
                canUpdate={data.permissions.canUpdate}
                canRemove={data.permissions.canRemove}
                actorUserId={data.permissions.actorUserId}
                onEditRole={(member) => setEditMember(member)}
                onEditPermissions={(member) => setPermissionsMember(member)}
                onRemove={(member) => setRemoveMember(member)}
              />
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <PendingInvitationsCard
                invitations={data.invitations}
                labels={labels}
                locale={locale}
                canManage={data.permissions.canInvite}
                onResend={(invitationId) => {
                  resendMutation.mutate(invitationId, {
                    onSuccess: () => toast.success(labels.feedback.resendSuccess),
                    onError: (error) =>
                      handleApiError(error, labels.feedback.resendError),
                  });
                }}
                onCancel={(invitationId) => {
                  cancelMutation.mutate(invitationId, {
                    onSuccess: () => toast.success(labels.feedback.cancelSuccess),
                    onError: (error) =>
                      handleApiError(error, labels.feedback.cancelError),
                  });
                }}
                resendingId={
                  resendMutation.isPending ? resendMutation.variables : null
                }
                cancellingId={
                  cancelMutation.isPending ? cancelMutation.variables : null
                }
              />
              <TeamActivityCard labels={labels.activity} />
            </div>
          </>
        )}
      </QueryResultState>

      {teamQuery.data ? (
        <>
          <InviteMemberDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            labels={labels}
            restaurants={teamQuery.data.restaurants}
            actorRole={teamQuery.data.permissions.actorRole}
            isPending={inviteMutation.isPending}
            onSubmit={async (input) => {
              try {
                await inviteMutation.mutateAsync(input);
                toast.success(labels.feedback.inviteSuccess);
              } catch (error) {
                handleApiError(error, labels.feedback.inviteError);
                throw error;
              }
            }}
          />

          <EditMemberRoleDialog
            open={editMember !== null}
            onOpenChange={(open) => {
              if (!open) {
                setEditMember(null);
              }
            }}
            member={editMember}
            labels={labels}
            restaurants={teamQuery.data.restaurants}
            actorRole={teamQuery.data.permissions.actorRole}
            isPending={updateMutation.isPending}
            onSubmit={async (input) => {
              if (!editMember) {
                return;
              }

              try {
                await updateMutation.mutateAsync({
                  membershipId: editMember.id,
                  body: input,
                });
                toast.success(labels.feedback.updateSuccess);
                setEditMember(null);
              } catch (error) {
                handleApiError(error, labels.feedback.updateError);
                throw error;
              }
            }}
          />

          <MemberPermissionsDialog
            open={permissionsMember !== null}
            onOpenChange={(open) => {
              if (!open) {
                setPermissionsMember(null);
              }
            }}
            member={permissionsMember}
            labels={labels}
            isPending={updateMutation.isPending}
            onSubmit={async (customPermissions) => {
              if (!permissionsMember) {
                return;
              }

              try {
                await updateMutation.mutateAsync({
                  membershipId: permissionsMember.id,
                  body: { customPermissions },
                });
                toast.success(labels.feedback.updateSuccess);
                setPermissionsMember(null);
              } catch (error) {
                handleApiError(error, labels.feedback.updateError);
                throw error;
              }
            }}
          />

          <TeamPermissionsReferenceDialog
            open={permissionsOpen}
            onOpenChange={setPermissionsOpen}
            labels={labels}
          />

          <ConfirmDialog
            open={removeMember !== null}
            onOpenChange={(open) => {
              if (!open) {
                setRemoveMember(null);
              }
            }}
            title={labels.dialogs.removeTitle}
            description={labels.dialogs.removeDescription}
            confirmLabel={labels.actions.removeMember}
            cancelLabel={labels.actions.cancel}
            isPending={removeMutation.isPending}
            onConfirm={() => {
              if (!removeMember) {
                return;
              }

              removeMutation.mutate(removeMember.id, {
                onSuccess: () => {
                  toast.success(labels.feedback.removeSuccess);
                  setRemoveMember(null);
                },
                onError: (error) =>
                  handleApiError(error, labels.feedback.removeError),
              });
            }}
          />
        </>
      ) : null}
    </main>
  );
}
