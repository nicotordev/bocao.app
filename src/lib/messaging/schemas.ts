import { z } from "zod";

export const sendWhatsAppMessageBodySchema = z.object({
  conversationId: z.string().cuid(),
  body: z.string().trim().min(1).max(4096),
});

export const updateConversationBodySchema = z.object({
  status: z.enum(["open", "closed"]).optional(),
  assignedToId: z.string().cuid().nullable().optional(),
});

export const conversationsListQuerySchema = z.object({
  status: z.enum(["open", "closed", "all"]).optional(),
  assignment: z.enum(["mine", "unassigned", "all"]).optional(),
  search: z.string().trim().optional(),
  conversationId: z.string().cuid().optional(),
});
