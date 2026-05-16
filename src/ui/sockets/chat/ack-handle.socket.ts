import type { ChatSocketHandlers } from './types.socket';

export const handleChatAck = (params: { handlers: ChatSocketHandlers; payloadChatId: string | null; raw: Record<string, unknown>; requestId: string | null }) => {
    params.handlers.onAck?.({
        requestId: params.requestId,
        chatId: params.payloadChatId,
        raw: params.raw
    });
};
