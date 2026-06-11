export type WhatsAppInboxLabels = {
  title: string;
  description: string;
  open: string;
  closed: string;
  assignedToMe: string;
  unassigned: string;
  all: string;
  searchPlaceholder: string;
  sendMessage: string;
  messagePlaceholder: string;
  closeConversation: string;
  reopenConversation: string;
  emptyTitle: string;
  emptyDescription: string;
  selectConversation: string;
  customer: string;
  phone: string;
  status: string;
  assignedTo: string;
  unassignedLabel: string;
  assignTo: string;
  suggestAiReply: string;
  suggestAiReplySoon: string;
  messageStatus: {
    received: string;
    sent: string;
    delivered: string;
    read: string;
    failed: string;
  };
  errors: {
    sendFailed: string;
    updateFailed: string;
  };
  success: {
    sent: string;
    closed: string;
    reopened: string;
    assigned: string;
  };
};
