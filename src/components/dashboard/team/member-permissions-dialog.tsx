"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getPermissionsForRole,
  isTeamRole,
  TEAM_PERMISSIONS,
  type TeamPermission,
} from "@/lib/team/permissions";
import type { TeamMemberView } from "@/lib/team/types";
import type { TeamLabels } from "./types";

type MemberPermissionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMemberView | null;
  labels: TeamLabels;
  onSubmit: (permissions: TeamPermission[] | null) => Promise<void>;
  isPending?: boolean;
};

type MemberPermissionsDialogContentProps = Omit<
  MemberPermissionsDialogProps,
  "member"
> & {
  member: TeamMemberView;
};

function MemberPermissionsDialogContent({
  onOpenChange,
  member,
  labels,
  onSubmit,
  isPending = false,
}: MemberPermissionsDialogContentProps) {
  const defaultPermissions = useMemo(() => {
    if (isTeamRole(member.role)) {
      return getPermissionsForRole(member.role);
    }

    return getPermissionsForRole("waiter");
  }, [member.role]);

  const hasCustom =
    member.customPermissions !== null && member.customPermissions.length > 0;

  const [useCustom, setUseCustom] = useState(hasCustom);
  const [selected, setSelected] = useState<TeamPermission[]>(
    hasCustom ? member.customPermissions! : defaultPermissions,
  );

  const togglePermission = (permission: TeamPermission, checked: boolean) => {
    setSelected((current) =>
      checked
        ? [...new Set([...current, permission])]
        : current.filter((item) => item !== permission),
    );
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{labels.dialogs.permissionsTitle}</DialogTitle>
        <DialogDescription>
          {labels.dialogs.permissionsDescription}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={useCustom}
            onCheckedChange={(value) => {
              const enabled = value === true;
              setUseCustom(enabled);
              setSelected(enabled ? selected : defaultPermissions);
            }}
          />
          <span>{labels.dialogs.customPermissions}</span>
        </label>

        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-3">
          {TEAM_PERMISSIONS.map((permission) => {
            const checked = selected.includes(permission);
            const disabled = !useCustom;

            return (
              <label
                key={permission}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(value) =>
                    togglePermission(permission, value === true)
                  }
                />
                <span>{labels.permissions[permission] ?? permission}</span>
              </label>
            );
          })}
        </div>

        {!useCustom ? (
          <p className="text-xs text-muted-foreground">
            {labels.roles[isTeamRole(member.role) ? member.role : "staff"]}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          {labels.actions.cancel}
        </Button>
        <Button
          type="button"
          onClick={() => void onSubmit(useCustom ? selected : null)}
          disabled={isPending}
        >
          {labels.actions.save}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function MemberPermissionsDialog({
  open,
  onOpenChange,
  member,
  labels,
  onSubmit,
  isPending = false,
}: MemberPermissionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {member ? (
        <MemberPermissionsDialogContent
          key={member.id}
          open={open}
          onOpenChange={onOpenChange}
          member={member}
          labels={labels}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      ) : null}
    </Dialog>
  );
}
