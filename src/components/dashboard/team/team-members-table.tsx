"use client";

import { TbDotsVertical } from "react-icons/tb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTeamDateTime } from "@/lib/team/format";
import type { TeamMemberView } from "@/lib/team/types";
import { TeamRoleBadge } from "./team-role-badge";
import type { TeamLabels } from "./types";

type TeamMembersTableProps = {
  members: TeamMemberView[];
  labels: TeamLabels;
  locale: string;
  canUpdate: boolean;
  canRemove: boolean;
  actorUserId: string;
  onEditRole: (member: TeamMemberView) => void;
  onEditPermissions: (member: TeamMemberView) => void;
  onRemove: (member: TeamMemberView) => void;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamMembersTable({
  members,
  labels,
  locale,
  canUpdate,
  canRemove,
  actorUserId,
  onEditRole,
  onEditPermissions,
  onRemove,
}: TeamMembersTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{labels.table.user}</TableHead>
            <TableHead className="hidden md:table-cell">
              {labels.table.email}
            </TableHead>
            <TableHead>{labels.table.role}</TableHead>
            <TableHead className="hidden lg:table-cell">
              {labels.table.restaurants}
            </TableHead>
            <TableHead>{labels.table.status}</TableHead>
            <TableHead className="hidden xl:table-cell">
              {labels.table.lastActivity}
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              {labels.table.joinedAt}
            </TableHead>
            <TableHead className="text-right">{labels.table.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const roleLabel =
              labels.roles[member.role] ?? labels.roles.viewer;
            const showActions = canUpdate || canRemove;

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{member.name}</p>
                      <p className="truncate text-xs text-muted-foreground md:hidden">
                        {member.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {member.email}
                </TableCell>
                <TableCell>
                  <TeamRoleBadge role={member.role} label={roleLabel} />
                </TableCell>
                <TableCell className="hidden max-w-xs lg:table-cell">
                  {member.restaurants.length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {member.restaurants.map((restaurant) => (
                        <Badge key={restaurant.id} variant="secondary">
                          {restaurant.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {labels.statuses[member.status]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {formatTeamDateTime(member.lastActivity, locale)}
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  {formatTeamDateTime(member.joinedAt, locale)}
                </TableCell>
                <TableCell className="text-right">
                  {showActions ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={labels.table.actions}
                        >
                          <TbDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate ? (
                          <>
                            <DropdownMenuItem onClick={() => onEditRole(member)}>
                              {labels.actions.editRole}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onEditPermissions(member)}
                            >
                              {labels.actions.editPermissions}
                            </DropdownMenuItem>
                          </>
                        ) : null}
                        {canRemove && member.userId !== actorUserId ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => onRemove(member)}
                            >
                              {labels.actions.removeMember}
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
