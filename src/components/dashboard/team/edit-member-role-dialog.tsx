"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  canAssignRole,
  isTeamRole,
  TEAM_ROLES,
  type TeamRole,
} from "@/lib/team/permissions";
import type { TeamMemberView, TeamRestaurantRef } from "@/lib/team/types";
import type { TeamLabels } from "./types";

type EditMemberRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMemberView | null;
  labels: TeamLabels;
  restaurants: TeamRestaurantRef[];
  actorRole: TeamRole | "staff";
  onSubmit: (input: {
    role: TeamRole;
    restaurantIds: string[];
  }) => Promise<void>;
  isPending?: boolean;
};

type EditMemberRoleDialogContentProps = Omit<
  EditMemberRoleDialogProps,
  "member"
> & {
  member: TeamMemberView;
};

function EditMemberRoleDialogContent({
  onOpenChange,
  member,
  labels,
  restaurants,
  actorRole,
  onSubmit,
  isPending = false,
}: EditMemberRoleDialogContentProps) {
  const [role, setRole] = useState<TeamRole>(
    isTeamRole(member.role) ? member.role : "waiter",
  );
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>(
    member.restaurants.map((item) => item.id),
  );

  const assignableRoles = TEAM_ROLES.filter((item) =>
    canAssignRole(actorRole, item),
  );

  const toggleRestaurant = (restaurantId: string, checked: boolean) => {
    setSelectedRestaurants((current) =>
      checked
        ? [...current, restaurantId]
        : current.filter((id) => id !== restaurantId),
    );
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{labels.dialogs.editRoleTitle}</DialogTitle>
        <DialogDescription>
          {labels.dialogs.editRoleDescription}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm">
          <p className="font-medium">{member.name}</p>
          <p className="text-muted-foreground">{member.email}</p>
        </div>

        <div className="space-y-2">
          <Label>{labels.dialogs.role}</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as TeamRole)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles.map((item) => (
                <SelectItem key={item} value={item}>
                  {labels.roles[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {restaurants.length > 0 ? (
          <div className="space-y-2">
            <Label>{labels.dialogs.restaurants}</Label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-3">
              {restaurants.map((restaurant) => {
                const checked = selectedRestaurants.includes(restaurant.id);

                return (
                  <label
                    key={restaurant.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        toggleRestaurant(restaurant.id, value === true)
                      }
                    />
                    <span>{restaurant.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
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
          onClick={() =>
            void onSubmit({ role, restaurantIds: selectedRestaurants })
          }
          disabled={isPending}
        >
          {labels.actions.save}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function EditMemberRoleDialog({
  open,
  onOpenChange,
  member,
  labels,
  restaurants,
  actorRole,
  onSubmit,
  isPending = false,
}: EditMemberRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {member ? (
        <EditMemberRoleDialogContent
          key={member.id}
          open={open}
          onOpenChange={onOpenChange}
          member={member}
          labels={labels}
          restaurants={restaurants}
          actorRole={actorRole}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      ) : null}
    </Dialog>
  );
}
