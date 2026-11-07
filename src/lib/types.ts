export interface LastMessage {
  text: string | null;
  direction: 'Inbound' | 'Outbound';
  status: string;
  timestampUtc: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  phoneNumberId: string;
  contactPhone: string;
  status: string;
  lastInboundAtUtc: string | null;
  windowExpiresAtUtc: string | null;
  isWindowOpen: boolean;
  updatedAtUtc: string;
  lastMessage: LastMessage | null;
}

export type MessageDirection = 'Inbound' | 'Outbound';

export interface Message {
  id: string;
  direction: MessageDirection;
  messageType: string;
  textPreview: string | null;
  contentJson: string;
  status: string;
  wamid: string | null;
  timestampUtc: string;
}

export interface SendTextPayload {
  to: string;
  text: string;
  phoneNumberId?: string;
}

export interface SendTextResponse {
  id: string;
  conversationId: string;
  status: string;
  textPreview: string;
  timestampUtc: string;
}
