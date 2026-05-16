import type { ChatSocketHandlers } from './types.socket';
import type { PendingChatSocketRequest } from './types.socket';
import { unwrapChatAssistantDonePayload } from './frame.socket';

export const handleChatAssistantDone = (params: { handlers: ChatSocketHandlers; pendingRequests: Map<string, PendingChatSocketRequest>; payloadChatId: string | null; raw: Record<string, unknown>; requestId: string | null }) => {
    const doneData = unwrapChatAssistantDonePayload(params.raw);
    const resolvedChatId = params.payloadChatId || (typeof doneData.chat?.id === 'string' ? doneData.chat.id : null);

    params.handlers.onAssistantDone?.({
        requestId: params.requestId,
        chatId: resolvedChatId,
        data: doneData
    });

    if (!params.requestId) {
        return;
    }

    const pending = params.pendingRequests.get(params.requestId);
    if (!pending) {
        return;
    }

    window.clearTimeout(pending.timeoutId);
    params.pendingRequests.delete(params.requestId);
    pending.resolve(doneData);
};
