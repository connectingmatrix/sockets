import type { JsonObject } from '@/orm/types';

export type AIChatQueryData = JsonObject;
export type ChatExecutionMode = 'DEFAULT' | 'AGENT' | 'WORKFLOW' | 'SWARM';

export type AIChatQueryRequest = JsonObject & {
    chat_id?: string | null;
    message?: string;
    request_id?: string;
    chat_mode?: ChatExecutionMode | null;
};

export type ChatAuthTokens = {
    accessToken: string;
};

export type ChatDebugServerPayload = JsonObject & {
    request_id: string | null;
    chat_id: string | null;
    stage: string;
    status: 'started' | 'progress' | 'completed' | 'failed';
    message: string;
    timestamp: string;
};

export type ChatSocketHandlers = {
    onAck?: (event: { requestId: string | null; chatId: string | null; raw: JsonObject }) => void;
    onAssistantDone?: (event: { requestId: string | null; chatId: string | null; data: AIChatQueryData }) => void;
    onDebug?: (event: ChatDebugServerPayload) => void;
    onError?: (event: { requestId: string | null; chatId: string | null; message: string; raw: JsonObject }) => void;
};

export type PendingChatSocketRequest = {
    chatId: string | null;
    chatMode: ChatExecutionMode | null;
    reject: (error: Error) => void;
    resolve: (value: AIChatQueryData) => void;
    timeoutId: number;
};
