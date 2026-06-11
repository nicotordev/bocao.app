import type { Prisma } from "@/generated/prisma/client";
import type { ConversationsListFilters } from "@/lib/messaging/filters";
import { mapConversationStatusFilter } from "@/lib/messaging/filters";
import {
  mapConversationDetail,
  mapConversationListItem,
  mapMessageListItem,
  mapUiStatusToDbStatus,
} from "@/lib/messaging/mappers";
import type {
  ConversationMessagesResponse,
  ConversationsListResponse,
} from "@/lib/messaging/types";
import { prisma } from "@/lib/prisma";
import {
  getMembershipWithPermissions,
  membershipHasPermission,
} from "@/lib/rbac/can";
import { PERMISSIONS } from "@/lib/rbac/permissions";

function buildConversationWhere(
  restaurantId: string,
  filters: ConversationsListFilters,
  currentUserId?: string,
): Prisma.ConversationWhereInput {
  const where: Prisma.ConversationWhereInput = {
    restaurantId,
  };

  const status = mapConversationStatusFilter(filters.status);

  if (status) {
    where.status = status;
  }

  if (filters.assignment === "mine" && currentUserId) {
    where.assignedToId = currentUserId;
  }

  if (filters.assignment === "unassigned") {
    where.assignedToId = null;
  }

  const search = filters.search.trim();

  if (search.length > 0) {
    where.OR = [
      { customerName: { contains: search, mode: "insensitive" } },
      { customerPhone: { contains: search } },
      { lastMessageText: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listConversations(
  restaurantId: string,
  filters: ConversationsListFilters,
  currentUserId?: string,
): Promise<ConversationsListResponse> {
  const conversations = await prisma.conversation.findMany({
    where: buildConversationWhere(restaurantId, filters, currentUserId),
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  return {
    conversations: conversations.map(mapConversationListItem),
    updatedAt: new Date().toISOString(),
  };
}

export async function getConversationMessages(
  restaurantId: string,
  conversationId: string,
): Promise<ConversationMessagesResponse | null> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      restaurantId,
    },
  });

  if (!conversation) {
    return null;
  }

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      restaurantId,
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    conversation: mapConversationDetail(conversation),
    messages: messages.map(mapMessageListItem),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateConversation(
  tenantId: string,
  restaurantId: string,
  conversationId: string,
  input: {
    status?: "open" | "closed";
    assignedToId?: string | null;
  },
) {
  const existing = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      restaurantId,
      tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  if (input.assignedToId) {
    const membership = await getMembershipWithPermissions(
      prisma,
      input.assignedToId,
      tenantId,
    );

    if (
      !membership ||
      membership.status !== "active" ||
      !membershipHasPermission(membership, PERMISSIONS.WHATSAPP_READ)
    ) {
      throw new Error(
        "Assigned user is not eligible to handle WhatsApp conversations",
      );
    }
  }

  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: input.status ? mapUiStatusToDbStatus(input.status) : undefined,
      assignedToId:
        input.assignedToId === undefined ? undefined : input.assignedToId,
    },
  });

  return mapConversationDetail(conversation);
}

export async function listAssignableMembers(tenantId: string) {
  const memberships = await prisma.membership.findMany({
    where: { organizationId: tenantId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((membership) => ({
    id: membership.user.id,
    name: membership.user.name,
  }));
}
