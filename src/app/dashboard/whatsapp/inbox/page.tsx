import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getLocale, getTranslations } from "next-intl/server";
import { WhatsAppInboxClient } from "@/components/dashboard/whatsapp/whatsapp-inbox-client";
import type { WhatsAppInboxLabels } from "@/components/dashboard/whatsapp/types";
import { getDashboardContext } from "@/lib/dashboard/context";
import { parseConversationsListSearchParams } from "@/lib/messaging/filters";
import { listConversations } from "@/lib/messaging/repository";
import { PERMISSIONS } from "@/lib/rbac/permissions";
import { getQueryClient } from "@/lib/query/get-query-client";
import { whatsappConversationsQueryOptions } from "@/lib/query/whatsapp/whatsapp.queries";
import { searchParamsToRecord } from "@/lib/list-url";

type WhatsAppInboxPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WhatsAppInboxPage({
  searchParams,
}: WhatsAppInboxPageProps) {
  const t = await getTranslations("dashboard.whatsappInbox");
  const locale = await getLocale();
  const context = await getDashboardContext();
  const restaurantId = context?.activeRestaurant?.id ?? "";
  const queryClient = getQueryClient();
  const resolvedSearchParams = searchParamsToRecord(await searchParams);
  const filters = parseConversationsListSearchParams(
    Object.fromEntries(
      Object.entries(resolvedSearchParams).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    ),
  );

  if (restaurantId && context) {
    await queryClient.prefetchQuery({
      ...whatsappConversationsQueryOptions(restaurantId, filters),
      queryFn: () =>
        listConversations(restaurantId, filters, context.user.id),
    });
  }

  const labels: WhatsAppInboxLabels = {
    title: t("title"),
    description: t("description"),
    open: t("open"),
    closed: t("closed"),
    assignedToMe: t("assignedToMe"),
    unassigned: t("unassigned"),
    all: t("all"),
    searchPlaceholder: t("searchPlaceholder"),
    sendMessage: t("sendMessage"),
    messagePlaceholder: t("messagePlaceholder"),
    closeConversation: t("closeConversation"),
    reopenConversation: t("reopenConversation"),
    emptyTitle: t("emptyTitle"),
    emptyDescription: t("emptyDescription"),
    selectConversation: t("selectConversation"),
    customer: t("customer"),
    phone: t("phone"),
    status: t("status"),
    assignedTo: t("assignedTo"),
    unassignedLabel: t("unassignedLabel"),
    assignTo: t("assignTo"),
    suggestAiReply: t("suggestAiReply"),
    suggestAiReplySoon: t("suggestAiReplySoon"),
    messageStatus: {
      received: t("messageStatus.received"),
      sent: t("messageStatus.sent"),
      delivered: t("messageStatus.delivered"),
      read: t("messageStatus.read"),
      failed: t("messageStatus.failed"),
    },
    errors: {
      sendFailed: t("errors.sendFailed"),
      updateFailed: t("errors.updateFailed"),
    },
    success: {
      sent: t("success.sent"),
      closed: t("success.closed"),
      reopened: t("success.reopened"),
      assigned: t("success.assigned"),
    },
  };

  const canWrite =
    context?.membership.permissions.includes(PERMISSIONS.WHATSAPP_WRITE) ??
    false;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WhatsAppInboxClient
        labels={labels}
        restaurantId={restaurantId}
        currentUserId={context?.user.id ?? ""}
        locale={locale}
        canWrite={canWrite}
      />
    </HydrationBoundary>
  );
}
