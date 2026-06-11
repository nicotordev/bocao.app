import type { ConversationStatus } from "@/generated/prisma/client";
import { conversationsListQuerySchema } from "@/lib/messaging/schemas";

export type ConversationsListFilters = {
  status: "open" | "closed" | "all";
  assignment: "mine" | "unassigned" | "all";
  search: string;
  conversationId?: string;
};

export const defaultConversationsListFilters: ConversationsListFilters = {
  status: "open",
  assignment: "all",
  search: "",
};

export function parseConversationsListSearchParams(
  params: Record<string, string | undefined>,
): ConversationsListFilters {
  const parsed = conversationsListQuerySchema.safeParse({
    status: params.status,
    assignment: params.assignment,
    search: params.search,
    conversationId: params.conversationId,
  });

  if (!parsed.success) {
    return defaultConversationsListFilters;
  }

  return {
    status: parsed.data.status ?? "open",
    assignment: parsed.data.assignment ?? "all",
    search: parsed.data.search ?? "",
    conversationId: parsed.data.conversationId,
  };
}

export function mapConversationStatusFilter(
  status: ConversationsListFilters["status"],
): ConversationStatus | undefined {
  if (status === "open") {
    return "OPEN";
  }

  if (status === "closed") {
    return "CLOSED";
  }

  return undefined;
}
