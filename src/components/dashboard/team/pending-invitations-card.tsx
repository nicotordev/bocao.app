"use client";

import { TbMailForward, TbX } from "react-icons/tb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTeamDateTime } from "@/lib/team/format";
import type { TeamInvitationView } from "@/lib/team/types";
import { TeamRoleBadge } from "./team-role-badge";
import type { TeamLabels } from "./types";

type PendingInvitationsCardProps = {
  invitations: TeamInvitationView[];
  labels: TeamLabels;
  locale: string;
  canManage: boolean;
  onResend: (invitationId: string) => void;
  onCancel: (invitationId: string) => void;
  resendingId?: string | null;
  cancellingId?: string | null;
};

export function PendingInvitationsCard({
  invitations,
  labels,
  locale,
  canManage,
  onResend,
  onCancel,
  resendingId,
  cancellingId,
}: PendingInvitationsCardProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>{labels.invitations.title}</CardTitle>
        <CardDescription>{labels.invitations.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {labels.invitations.empty}
          </p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{invitation.email}</p>
                    <TeamRoleBadge
                      role={invitation.role}
                      label={labels.roles[invitation.role]}
                    />
                    <Badge variant="outline">
                      {labels.statuses.pending}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {invitation.restaurant ? (
                      <span>
                        {labels.invitations.restaurant}:{" "}
                        {invitation.restaurant.name}
                      </span>
                    ) : null}
                    {invitation.invitedBy ? (
                      <span>
                        {labels.invitations.invitedBy}:{" "}
                        {invitation.invitedBy.name}
                      </span>
                    ) : null}
                    <span>
                      {labels.invitations.expiresAt}:{" "}
                      {formatTeamDateTime(invitation.expiresAt, locale)}
                    </span>
                  </div>
                </div>

                {canManage ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onResend(invitation.id)}
                      disabled={
                        resendingId === invitation.id ||
                        cancellingId === invitation.id
                      }
                    >
                      <TbMailForward className="size-4" />
                      {labels.actions.resendInvitation}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onCancel(invitation.id)}
                      disabled={
                        resendingId === invitation.id ||
                        cancellingId === invitation.id
                      }
                    >
                      <TbX className="size-4" />
                      {labels.actions.cancelInvitation}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
