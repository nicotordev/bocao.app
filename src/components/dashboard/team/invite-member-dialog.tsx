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
import { Input } from "@/components/ui/input";
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
  TEAM_ROLES,
  type TeamRole,
} from "@/lib/team/permissions";
import type { TeamRestaurantRef } from "@/lib/team/types";
import type { TeamLabels } from "./types";

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: TeamLabels;
  restaurants: TeamRestaurantRef[];
  actorRole: TeamRole | "staff";
  onSubmit: (input: {
    email: string;
    role: TeamRole;
    restaurantIds?: string[];
  }) => Promise<void>;
  isPending?: boolean;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  labels,
  restaurants,
  actorRole,
  onSubmit,
  isPending = false,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("waiter");
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);

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

  const handleSubmit = async () => {
    await onSubmit({
      email,
      role,
      restaurantIds:
        selectedRestaurants.length > 0 ? selectedRestaurants : undefined,
    });
    setEmail("");
    setRole("waiter");
    setSelectedRestaurants([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.dialogs.inviteTitle}</DialogTitle>
          <DialogDescription>{labels.dialogs.inviteDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{labels.dialogs.email}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@empresa.com"
            />
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
              <p className="text-xs text-muted-foreground">
                {labels.dialogs.allRestaurants}
              </p>
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
            onClick={() => void handleSubmit()}
            disabled={isPending || email.trim().length === 0}
          >
            {labels.actions.sendInvitation}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
