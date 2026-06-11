"use client";

import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { useEffect, useRef } from "react";
import { TbArrowLeft, TbUser } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AssignableMember,
  ConversationDetail,
  MessageListItem,
} from "@/lib/messaging/types";
import { cn } from "@/lib/utils";
import { MessageComposer } from "./message-composer";
import type { WhatsAppInboxLabels } from "./types";

type ConversationThreadProps = {
  labels: WhatsAppInboxLabels;
  locale: string;
  customerName: string;
  messages: MessageListItem[];
  isLoading?: boolean;
  canReply?: boolean;
  isSending?: boolean;
  onSend: (body: string) => Promise<void>;
  onBack?: () => void;
  conversation?: ConversationDetail;
  members?: AssignableMember[];
  currentUserId?: string;
  isUpdating?: boolean;
  onClose?: () => void;
  onReopen?: () => void;
  onAssign?: (userId: string | null) => void;
};

function resolveDateLocale(locale: string) {
  return locale === "es" ? es : enUS;
}

function messageStatusLabel(
  labels: WhatsAppInboxLabels,
  status: MessageListItem["status"],
) {
  switch (status) {
    case "RECEIVED":
      return labels.messageStatus.received;
    case "SENT":
      return labels.messageStatus.sent;
    case "DELIVERED":
      return labels.messageStatus.delivered;
    case "READ":
      return labels.messageStatus.read;
    case "FAILED":
      return labels.messageStatus.failed;
  }
}

export function ConversationThread({
  labels,
  locale,
  customerName,
  messages,
  isLoading = false,
  canReply = true,
  isSending = false,
  onSend,
  onBack,
  conversation,
  members = [],
  currentUserId,
  isUpdating = false,
  onClose,
  onReopen,
  onAssign,
}: ConversationThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const showMobileActions =
    conversation && onClose && onReopen && onAssign && members.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-3 md:px-4">
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 lg:hidden"
            onClick={onBack}
            aria-label={labels.open}
          >
            <TbArrowLeft className="size-4" aria-hidden />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{customerName}</h2>
          {conversation ? (
            <p className="truncate text-xs text-muted-foreground">
              {conversation.customerPhone}
            </p>
          ) : null}
        </div>
        {showMobileActions ? (
          <div className="flex shrink-0 items-center gap-2 xl:hidden">
            {conversation.status === "OPEN" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={onClose}
              >
                {labels.closeConversation}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={onReopen}
              >
                {labels.reopenConversation}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  disabled={isUpdating}
                  aria-label={labels.assignTo}
                >
                  <TbUser className="size-4" aria-hidden />
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
                    {member.id === currentUserId
                      ? ` (${labels.assignedToMe})`
                      : ""}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-2/3 rounded-2xl" />
            <Skeleton className="ml-auto h-16 w-2/3 rounded-2xl" />
            <Skeleton className="h-16 w-2/3 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOutbound = message.direction === "OUTBOUND";

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isOutbound ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[80%]",
                      isOutbound
                        ? "bg-emerald-600 text-white"
                        : "border border-border/60 bg-muted/30",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.body ?? `[${message.type}]`}
                    </p>
                    <div
                      className={cn(
                        "mt-2 flex flex-wrap items-center gap-2 text-xs",
                        isOutbound
                          ? "text-emerald-50/80"
                          : "text-muted-foreground",
                      )}
                    >
                      <span>
                        {format(
                          new Date(
                            message.sentAt ??
                              message.receivedAt ??
                              message.createdAt,
                          ),
                          "HH:mm",
                          { locale: resolveDateLocale(locale) },
                        )}
                      </span>
                      {isOutbound ? (
                        <Badge
                          variant="outline"
                          className="border-white/20 bg-white/10 text-white"
                        >
                          {messageStatusLabel(labels, message.status)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageComposer
        labels={labels}
        disabled={!canReply}
        isSending={isSending}
        onSend={onSend}
      />
    </div>
  );
}
