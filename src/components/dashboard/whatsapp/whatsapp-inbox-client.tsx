"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { TbBrandWhatsapp } from "react-icons/tb";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/query/query-result-state";
import { parseConversationsListSearchParams } from "@/lib/messaging/filters";
import { buildListUrl } from "@/lib/list-url";
import {
  useSendWhatsAppMessageMutation,
  useUpdateWhatsAppConversationMutation,
} from "@/lib/query/whatsapp/whatsapp.mutations";
import {
  whatsappConversationQueryOptions,
  whatsappConversationsQueryOptions,
  whatsappMembersQueryOptions,
} from "@/lib/query/whatsapp/whatsapp.queries";
import { useWhatsAppPolling } from "@/lib/query/whatsapp/use-whatsapp-polling";
import { cn } from "@/lib/utils";
import { ConversationDetails } from "./conversation-details";
import { ConversationList } from "./conversation-list";
import { ConversationThread } from "./conversation-thread";
import type { WhatsAppInboxLabels } from "./types";

type WhatsAppInboxClientProps = {
  labels: WhatsAppInboxLabels;
  restaurantId: string;
  currentUserId: string;
  locale: string;
  canWrite: boolean;
};

export function WhatsAppInboxClient({
  labels,
  restaurantId,
  currentUserId,
  locale,
  canWrite,
}: WhatsAppInboxClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = useMemo(
    () =>
      parseConversationsListSearchParams(
        Object.fromEntries(searchParams.entries()),
      ),
    [searchParams],
  );

  const selectedConversationId =
    searchParams.get("conversationId") ?? undefined;

  const conversationsQuery = useQuery(
    whatsappConversationsQueryOptions(restaurantId, filters),
  );

  const conversationQuery = useQuery({
    ...whatsappConversationQueryOptions(
      restaurantId,
      selectedConversationId ?? "",
    ),
    enabled: Boolean(selectedConversationId),
  });

  const membersQuery = useQuery(whatsappMembersQueryOptions(restaurantId));

  const sendMessageMutation = useSendWhatsAppMessageMutation(
    restaurantId,
    filters,
  );

  const updateConversationMutation = useUpdateWhatsAppConversationMutation(
    restaurantId,
    filters,
  );

  useWhatsAppPolling({
    restaurantId,
    conversationId: selectedConversationId,
    filters,
    enabled: restaurantId.length > 0,
  });

  const updateUrl = useCallback(
    (next: Record<string, string | undefined>) => {
      startTransition(() => {
        router.replace(
          buildListUrl("/dashboard/whatsapp/inbox", {
            ...Object.fromEntries(searchParams.entries()),
            ...next,
          }),
        );
      });
    },
    [router, searchParams],
  );

  const handleFiltersChange = useCallback(
    (partial: Partial<typeof filters>) => {
      updateUrl({
        status: partial.status ?? filters.status,
        assignment: partial.assignment ?? filters.assignment,
        search: partial.search ?? filters.search,
      });
    },
    [filters, updateUrl],
  );

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      updateUrl({ conversationId });
    },
    [updateUrl],
  );

  const handleBackToList = useCallback(() => {
    updateUrl({ conversationId: undefined });
  }, [updateUrl]);

  const handleSendMessage = useCallback(
    async (body: string) => {
      if (!selectedConversationId) {
        return;
      }

      try {
        await sendMessageMutation.mutateAsync({
          conversationId: selectedConversationId,
          body,
        });
        toast.success(labels.success.sent);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : labels.errors.sendFailed,
        );
      }
    },
    [
      labels.errors.sendFailed,
      labels.success.sent,
      selectedConversationId,
      sendMessageMutation,
    ],
  );

  const handleCloseConversation = useCallback(async () => {
    if (!selectedConversationId) {
      return;
    }

    try {
      await updateConversationMutation.mutateAsync({
        conversationId: selectedConversationId,
        status: "closed",
      });
      toast.success(labels.success.closed);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : labels.errors.updateFailed,
      );
    }
  }, [
    labels.errors.updateFailed,
    labels.success.closed,
    selectedConversationId,
    updateConversationMutation,
  ]);

  const handleReopenConversation = useCallback(async () => {
    if (!selectedConversationId) {
      return;
    }

    try {
      await updateConversationMutation.mutateAsync({
        conversationId: selectedConversationId,
        status: "open",
      });
      toast.success(labels.success.reopened);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : labels.errors.updateFailed,
      );
    }
  }, [
    labels.errors.updateFailed,
    labels.success.reopened,
    selectedConversationId,
    updateConversationMutation,
  ]);

  const handleAssignConversation = useCallback(
    async (userId: string | null) => {
      if (!selectedConversationId) {
        return;
      }

      try {
        await updateConversationMutation.mutateAsync({
          conversationId: selectedConversationId,
          assignedToId: userId,
        });
        toast.success(labels.success.assigned);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : labels.errors.updateFailed,
        );
      }
    },
    [
      labels.errors.updateFailed,
      labels.success.assigned,
      selectedConversationId,
      updateConversationMutation,
    ],
  );

  if (!restaurantId) {
    return (
      <main className="flex flex-1 flex-col p-4 md:p-6">
        <Empty className="border border-dashed border-border/70 py-16">
          <EmptyHeader>
            <EmptyTitle>{labels.emptyTitle}</EmptyTitle>
            <EmptyDescription>{labels.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </main>
    );
  }

  if (conversationsQuery.isError) {
    return (
      <main className="flex flex-1 flex-col p-4 md:p-6">
        <QueryErrorState onRetry={() => void conversationsQuery.refetch()} />
      </main>
    );
  }

  const conversations = conversationsQuery.data?.conversations ?? [];
  const activeConversation = conversationQuery.data?.conversation;
  const activeMessages = conversationQuery.data?.messages ?? [];
  const members = membersQuery.data?.members ?? [];

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:gap-5 md:p-6">
      <div className="shrink-0">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="text-sm text-muted-foreground">{labels.description}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/40">
        {conversationsQuery.isLoading ? (
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,16rem)]">
            <div className="border-b border-border/60 p-4 lg:border-b-0 lg:border-r">
              <Skeleton className="mb-3 h-10 w-full rounded-xl" />
              <Skeleton className="mb-3 h-10 w-full rounded-xl" />
              <Skeleton className="h-full min-h-48 w-full rounded-xl" />
            </div>
            <div className="hidden p-4 lg:block">
              <Skeleton className="h-full min-h-48 w-full rounded-xl" />
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <Empty className="border border-dashed border-border/70 py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TbBrandWhatsapp aria-hidden />
                </EmptyMedia>
                <EmptyTitle>{labels.emptyTitle}</EmptyTitle>
                <EmptyDescription className="max-w-md">
                  {labels.emptyDescription}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,18rem)_minmax(0,1fr)_minmax(0,16rem)]">
            <div
              className={cn(
                "min-h-0 overflow-hidden",
                selectedConversationId ? "hidden lg:block" : "block",
              )}
            >
              <ConversationList
                labels={labels}
                locale={locale}
                conversations={conversations}
                filters={filters}
                selectedConversationId={selectedConversationId}
                onFiltersChange={handleFiltersChange}
                onSelectConversation={handleSelectConversation}
              />
            </div>

            <div
              className={cn(
                "min-h-0 overflow-hidden",
                selectedConversationId ? "block" : "hidden lg:block",
              )}
            >
              {selectedConversationId ? (
                conversationQuery.isError ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <QueryErrorState
                      onRetry={() => void conversationQuery.refetch()}
                    />
                  </div>
                ) : (
                  <ConversationThread
                    labels={labels}
                    locale={locale}
                    customerName={
                      activeConversation?.customerName ??
                      activeConversation?.customerPhone ??
                      labels.customer
                    }
                    messages={activeMessages}
                    isLoading={conversationQuery.isLoading}
                    canReply={
                      canWrite && activeConversation?.status === "OPEN"
                    }
                    isSending={sendMessageMutation.isPending}
                    onSend={handleSendMessage}
                    onBack={handleBackToList}
                    conversation={activeConversation}
                    members={members}
                    currentUserId={currentUserId}
                    isUpdating={updateConversationMutation.isPending}
                    onClose={() => void handleCloseConversation()}
                    onReopen={() => void handleReopenConversation()}
                    onAssign={(userId) => void handleAssignConversation(userId)}
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                  {labels.selectConversation}
                </div>
              )}
            </div>

            <div className="hidden min-h-0 overflow-hidden xl:block">
              <ConversationDetails
                labels={labels}
                conversation={activeConversation}
                members={members}
                currentUserId={currentUserId}
                isUpdating={updateConversationMutation.isPending}
                onClose={() => void handleCloseConversation()}
                onReopen={() => void handleReopenConversation()}
                onAssign={(userId) => void handleAssignConversation(userId)}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
