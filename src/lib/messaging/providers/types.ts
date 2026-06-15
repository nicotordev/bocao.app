export type MessagingProviderSlug = "meta_whatsapp" | "twilio_whatsapp";

export type NormalizedMessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "unknown";

export type NormalizedIncomingMessage = {
  provider: MessagingProviderSlug;
  providerMessageId: string;
  providerThreadId?: string;
  /** Meta Graph API phone_number_id that received the message. */
  providerPhoneNumberId?: string;
  fromPhone: string;
  toPhone?: string;
  customerName?: string;
  body?: string;
  messageType: NormalizedMessageType;
  receivedAt: Date;
  rawPayload: unknown;
};

export type SendOutboundMessageInput = {
  toPhone: string;
  body: string;
  credentials: {
    accessToken: string;
    phoneNumberId: string;
  };
};

export type SendOutboundMessageResult = {
  providerMessageId: string;
  sentAt: Date;
  rawPayload: unknown;
};
