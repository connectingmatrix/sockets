import type { AIChatQueryData } from './types.socket';

export const getChatFramePayload = (value: unknown): Record<string, unknown> | null => {
    const root = value as { payload?: Record<string, unknown> } | null;
    if (!root || typeof root !== 'object') return null;
    if (root.payload && typeof root.payload === 'object') return root.payload;
    return root as Record<string, unknown>;
};

export const getChatFrameType = (defaultType: string, value: unknown): string => {
    const root = value as { type?: string } | null;
    return root?.type || defaultType;
};

export const getChatIdentifiers = (framePayload: Record<string, unknown>): { payloadChatId: string | null; requestId: string | null } => ({
    requestId: typeof framePayload.request_id === 'string' ? framePayload.request_id : null,
    payloadChatId: typeof framePayload.chat_id === 'string' ? framePayload.chat_id : null
});

export const unwrapChatAssistantDonePayload = (payload: Record<string, unknown>): AIChatQueryData => {
    return (payload.data || payload) as AIChatQueryData;
};
