import type { ChatDebugServerPayload, ChatSocketHandlers } from './types.socket';

export const handleChatDebug = (params: { handlers: ChatSocketHandlers; payloadChatId: string | null; raw: Record<string, unknown>; requestId: string | null }) => {
    const status = params.raw.status;
    if (status !== 'started' && status !== 'progress' && status !== 'completed' && status !== 'failed') return;
    params.handlers.onDebug?.({
        request_id: params.requestId,
        chat_id: params.payloadChatId,
        stage: typeof params.raw.stage === 'string' ? params.raw.stage : 'debug',
        status,
        message: typeof params.raw.message === 'string' ? params.raw.message : '',
        timestamp: typeof params.raw.timestamp === 'string' ? params.raw.timestamp : new Date().toISOString(),
        meta: params.raw.meta
    } as ChatDebugServerPayload);
};
