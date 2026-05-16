import type { JsonObject } from '@giga/dataloader/client/legacy/orm/types';

let disconnectPage: (() => void) | null = null;

export const CHAT_SOCKET_EVENT_TYPES = {
    connect: 'chat:connect',
    ready: 'chat:ready',
    connectError: 'chat:connect_error',
    disconnect: 'chat:disconnect',
    disconnectManual: 'chat:disconnect.manual',
    send: 'chat:send',
    ack: 'chat:ack',
    debug: 'chat:debug',
    assistantDone: 'chat:assistant:done',
    error: 'chat:error',
    requestStart: 'chat:request:start',
    requestProgress: 'chat:request:progress',
    requestDone: 'chat:request:done',
    requestError: 'chat:request:error'
} as const;

export type ChatSocketEventType = (typeof CHAT_SOCKET_EVENT_TYPES)[keyof typeof CHAT_SOCKET_EVENT_TYPES];
export type ChatSocketPageEventDetail = JsonObject;

export const registerChatSocketPage = (disconnect: () => void): void => {
    disconnectPage = disconnect;
};

export const disconnectChatSocketPage = (): void => {
    disconnectPage?.();
};

export const publishChatSocketPageEvent = (type: ChatSocketEventType, detail: ChatSocketPageEventDetail): void => {
    window.dispatchEvent(new CustomEvent('giga:chat-socket', { detail: { type, ...detail } }));
};
