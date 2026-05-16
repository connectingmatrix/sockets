import type { ChatSendPayload, SocketEventEnvelope } from '@giga/shared/types/contracts/chat.types';

export const normalizeChatSendPayload = (rawPayload: ChatSendPayload | SocketEventEnvelope<ChatSendPayload> | null | undefined): ChatSendPayload => {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    return {} as ChatSendPayload;
  }

  const payloadMap = rawPayload as Record<string, any>;
  if (payloadMap.payload && typeof payloadMap.payload === 'object' && !Array.isArray(payloadMap.payload)) {
    const { payload, type, ...rest } = payloadMap;
    return { ...(rest as ChatSendPayload), ...(payload as ChatSendPayload) };
  }

  return payloadMap as ChatSendPayload;
};
