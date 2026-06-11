"use client";

import { TbUser } from "react-icons/tb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import type { AssignableMember, ConversationDetail } from "@/lib/messaging/types";
import type { WhatsAppInboxLabels } from "./types";

type ConversationDetailsProps = {
  labels: WhatsAppInboxLabels;
  conversation?: ConversationDetail;
  members: AssignableMember[];
  currentUserId: string;
  isUpdating?: boolean;
  onClose: () => void;
  onReopen: () => void;
  onAssign: (userId: string | null) => void;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ConversationDetails({
  labels,
  conversation,
  members,
  currentUserId,
  isUpdating = false,
  onClose,
  onReopen,
  onAssign,
}: ConversationDetailsProps) {
  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center border-l border-border/60 bg-card/20 p-6 text-sm text-muted-foreground">
        {labels.selectConversation}
      </div>
    );
  }

  const displayName = conversation.customerName ?? conversation.customerPhone;
  const assignedMember = members.find(
    (member) => member.id === conversation.assignedToId,
  );

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border/60 bg-card/20">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-emerald-500/15 text-emerald-400">
              {initialsFromName(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">{conversation.customerPhone}</p>
          </div>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{labels.status}</span>
            <Badge variant="outline">
              {conversation.status === "OPEN" ? labels.open : labels.closed}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{labels.assignedTo}</span>
            <span className="text-right">
              {assignedMember?.name ?? labels.unassignedLabel}
            </span>
          </div>
        </div>

        <Separator />

        <div className="grid gap-2">
          {conversation.status === "OPEN" ? (
            <Button
              type="button"
              variant="outline"
              disabled={isUpdating}
              onClick={onClose}
            >
              {labels.closeConversation}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={isUpdating}
              onClick={onReopen}
            >
              {labels.reopenConversation}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" disabled={isUpdating}>
                <TbUser className="size-4" aria-hidden />
                {labels.assignTo}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onAssign(null)}>
                {labels.unassignedLabel}
              </DropdownMenuItem>
              {members.map((member) => (
                <DropdownMenuItem
                  key={member.id}
                  onClick={() => onAssign(member.id)}
                >
                  {member.name}
                  {member.id === currentUserId ? ` (${labels.assignedToMe})` : ""}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
