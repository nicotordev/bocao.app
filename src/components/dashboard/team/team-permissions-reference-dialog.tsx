"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TEAM_ROLE_DEFINITIONS } from "@/lib/team/permissions";
import { TeamRoleBadge } from "./team-role-badge";
import type { TeamLabels } from "./types";

type TeamPermissionsReferenceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: TeamLabels;
};

export function TeamPermissionsReferenceDialog({
  open,
  onOpenChange,
  labels,
}: TeamPermissionsReferenceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{labels.dialogs.permissionsTitle}</DialogTitle>
          <DialogDescription>
            {labels.dialogs.permissionsDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {TEAM_ROLE_DEFINITIONS.map((definition) => (
            <div
              key={definition.slug}
              className="rounded-2xl border border-border/60 bg-muted/20 p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <TeamRoleBadge
                  role={definition.slug}
                  label={labels.roles[definition.slug]}
                />
              </div>
              <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                {definition.permissions.map((permission) => (
                  <li key={permission}>
                    {labels.permissions[permission] ?? permission}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
