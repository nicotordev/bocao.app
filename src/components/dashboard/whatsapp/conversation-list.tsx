"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { TbBrandWhatsapp } from "react-icons/tb";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ConversationListItem } from "@/lib/messaging/types";
import type { ConversationsListFilters } from "@/lib/messaging/filters";
import { cn } from "@/lib/utils";
import type { WhatsAppInboxLabels } from "./types";

type ConversationListProps = {
  labels: WhatsAppInboxLabels;
  locale: string;
  conversations: ConversationListItem[];
  filters: ConversationsListFilters;
  selectedConversationId?: string;
  onFiltersChange: (filters: Partial<ConversationsListFilters>) => void;
  onSelectConversation: (conversationId: string) => void;
};

function resolveDateLocale(locale: string) {
  return locale === "es" ? es : enUS;
}

export function ConversationList({
  labels,
  locale,
  conversations,
  filters,
  selectedConversationId,
  onFiltersChange,
  onSelectConversation,
}: ConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-card/30">
      <div className="shrink-0 space-y-3 border-b border-border/60 p-3">
        <Input
          value={filters.search}
          onChange={(event) => onFiltersChange({ search: event.target.value })}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchPlaceholder}
        />
        <Tabs
          value={filters.status}
          onValueChange={(value) =>
            onFiltersChange({
              status: value as ConversationsListFilters["status"],
            })
          }
        >
          <TabsList className="grid h-auto w-full grid-cols-2">
            <TabsTrigger value="open" className="text-xs sm:text-sm">
              {labels.open}
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-xs sm:text-sm">
              {labels.closed}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs
          value={filters.assignment}
          onValueChange={(value) =>
            onFiltersChange({
              assignment: value as ConversationsListFilters["assignment"],
            })
          }
        >
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
            <TabsTrigger value="all" className="px-2 text-[11px] sm:text-xs">
              {labels.all}
            </TabsTrigger>
            <TabsTrigger value="mine" className="px-2 text-[11px] sm:text-xs">
              {labels.assignedToMe}
            </TabsTrigger>
            <TabsTrigger
              value="unassigned"
              className="px-2 text-[11px] sm:text-xs"
            >
              {labels.unassigned}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="divide-y divide-border/50">
          {conversations.map((conversation) => {
            const displayName =
              conversation.customerName ?? conversation.customerPhone;
            const isSelected = conversation.id === selectedConversationId;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40",
                  isSelected && "bg-emerald-500/10",
                )}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <TbBrandWhatsapp className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{displayName}</span>
                    {conversation.lastMessageAt ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(
                          new Date(conversation.lastMessageAt),
                          {
                            addSuffix: true,
                            locale: resolveDateLocale(locale),
                          },
                        )}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="truncate text-sm text-muted-foreground">
                      {conversation.lastMessageText ??
                        conversation.customerPhone}
                    </span>
                    {conversation.status === "CLOSED" ? (
                      <Badge variant="outline" className="shrink-0">
                        {labels.closed}
                      </Badge>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
