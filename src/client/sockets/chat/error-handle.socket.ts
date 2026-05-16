import type { ChatSocketHandlers } from './types.socket';
import type { PendingChatSocketRequest } from './types.socket';

export const handleChatError = (params: {
    handlers: ChatSocketHandlers;
    payloadChatId: string | null;
    pendingRequests: Map<string, PendingChatSocketRequest>;
    raw: Record<string, unknown>;
    requestId: string | null;
    socketError: new (message: string) => Error;
}) => {
    const message = typeof params.raw.message === 'string' && params.raw.message.trim() ? params.raw.message : 'Socket chat request failed.';

    params.handlers.onError?.({
        requestId: params.requestId,
        chatId: params.payloadChatId,
        message,
        raw: params.raw
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
    pending.reject(new params.socketError(message));
};
