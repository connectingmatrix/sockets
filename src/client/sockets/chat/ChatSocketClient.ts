import { io, Socket } from 'socket.io-client';
import { API_ORIGIN, CHAT_REQUEST_TIMEOUT_MS, CHAT_WS_URL } from '@/graphql/env';
import { createRequestId } from '@/graphql/client';
import type { AIChatQueryData, AIChatQueryRequest, ChatAuthTokens, ChatSocketHandlers } from './types.socket';
import { resolveSocketConfig } from '../core/socket-url';
import { handleChatAck } from './ack-handle.socket';
import { handleChatAssistantDone } from './assistant-done-handle.socket';
import { handleChatDebug } from './debug-handle.socket';
import { handleChatDisconnect } from './disconnect-handle.socket';
import { handleChatError } from './error-handle.socket';
import { getChatFramePayload, getChatFrameType, getChatIdentifiers } from './frame.socket';
import type { PendingChatSocketRequest } from './types.socket';
import { CHAT_SOCKET_EVENT_TYPES, publishChatSocketPageEvent, registerChatSocketPage } from './page-events.socket';

class ChatSocketError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ChatSocketError';
    }
}

export class ChatSocketClient {
    private socket: Socket | null = null;
    private connectPromise: Promise<void> | null = null;
    private pendingRequests = new Map<string, PendingChatSocketRequest>();
    private handlers: ChatSocketHandlers = {};
    private joinedChatIds = new Set<string>();
    private isManualDisconnect = false;
    private isReady = false;

    constructor(private tokens: ChatAuthTokens) {}

    setHandlers(handlers: ChatSocketHandlers): void {
        this.handlers = handlers;
    }

    setTokens(tokens: ChatAuthTokens): void {
        this.tokens = tokens;
        if (!this.socket) {
            return;
        }

        this.socket.auth = {
            token: this.tokens.accessToken
        };
    }

    getPendingRequestCount(): number {
        return this.pendingRequests.size;
    }

    private getSocketConfig(): { url: string; path: string } {
        return resolveSocketConfig(CHAT_WS_URL, {
            url: API_ORIGIN,
            path: '/ws/chat'
        });
    }

    private normalizeChatId(chatId: string | null | undefined): string {
        const normalized = `${chatId || ''}`.trim();
        if (!normalized || normalized === 'null' || normalized === 'undefined') {
            return '';
        }

        return normalized;
    }

    private joinConnectedChat(chatId: string): void {
        if (!this.socket?.connected) {
            return;
        }

        this.socket.emit('chat:join', {
            chat_id: chatId,
            type: 'chat:join',
            payload: {
                chat_id: chatId
            }
        });
    }

    private trackChat(chatId: string | null | undefined): string {
        const normalizedChatId = this.normalizeChatId(chatId);
        if (!normalizedChatId) {
            return '';
        }

        this.joinedChatIds.add(normalizedChatId);
        return normalizedChatId;
    }

    private bindRequestToChat(requestId: string | null, chatId: string | null): void {
        const normalizedChatId = this.trackChat(chatId);
        if (!normalizedChatId) {
            return;
        }

        if (requestId) {
            const pending = this.pendingRequests.get(requestId);
            if (pending) {
                pending.chatId = normalizedChatId;
            }
        }

        this.joinConnectedChat(normalizedChatId);
    }

    private rejoinTrackedChats = (): void => {
        this.joinedChatIds.forEach((chatId) => {
            this.joinConnectedChat(chatId);
        });
    };

    private rejectPendingRequests(message: string, reason: string): void {
        const pendingEntries = Array.from(this.pendingRequests.entries());
        this.pendingRequests.clear();
        pendingEntries.forEach(([requestId, pending]) => {
            window.clearTimeout(pending.timeoutId);
            publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.requestError, {
                requestId,
                chatId: pending.chatId,
                chatMode: pending.chatMode,
                stage: 'disconnect',
                message,
                reason
            });
            this.handlers.onError?.({
                requestId,
                chatId: pending.chatId,
                message,
                raw: { reason }
            });
            pending.reject(new ChatSocketError(message));
        });
    }

    private handleIncoming = (eventType: string, rawPayload: unknown): void => {
        const type = getChatFrameType(eventType, rawPayload);
        const framePayload = getChatFramePayload(rawPayload);
        if (!framePayload) {
            return;
        }

        const { requestId, payloadChatId } = getChatIdentifiers(framePayload);
        const pendingChatMode = requestId ? this.pendingRequests.get(requestId)?.chatMode || null : null;
        this.bindRequestToChat(requestId, payloadChatId);
        const socketEventType = type === 'chat:ack'
            ? CHAT_SOCKET_EVENT_TYPES.ack
            : type === 'chat:debug'
              ? CHAT_SOCKET_EVENT_TYPES.debug
              : type === 'chat:assistant:done'
                ? CHAT_SOCKET_EVENT_TYPES.assistantDone
                : type === 'chat:error'
                  ? CHAT_SOCKET_EVENT_TYPES.error
                  : CHAT_SOCKET_EVENT_TYPES.send;
        publishChatSocketPageEvent(socketEventType, {
            requestId: requestId || '',
            chatId: payloadChatId || '',
            raw: framePayload
        });

        if (type === 'chat:ack') {
            publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.requestProgress, {
                requestId,
                chatId: payloadChatId,
                chatMode: pendingChatMode,
                stage: 'ack',
                raw: framePayload
            });
            handleChatAck({
                handlers: this.handlers,
                payloadChatId,
                raw: framePayload,
                requestId
            });
            return;
        }

        if (type === 'chat:debug') {
            publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.requestProgress, {
                requestId,
                chatId: payloadChatId,
                chatMode: pendingChatMode,
                stage: framePayload.stage,
                message: framePayload.message,
                raw: framePayload
            });
            handleChatDebug({
                handlers: this.handlers,
                payloadChatId,
                raw: framePayload,
                requestId
            });
            return;
        }

        if (type === 'chat:assistant:done') {
            handleChatAssistantDone({
                handlers: this.handlers,
                pendingRequests: this.pendingRequests,
                payloadChatId,
                raw: framePayload,
                requestId
            });
            publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.requestDone, {
                requestId,
                chatId: framePayload.chat_id || payloadChatId,
                chatMode: pendingChatMode,
                stage: 'assistant.done',
                raw: framePayload
            });
            return;
        }

        if (type === 'chat:error') {
            const errorMessage = typeof framePayload.message === 'string' && framePayload.message.trim() ? framePayload.message : 'Socket chat request failed.';
            publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.requestError, {
                requestId,
                chatId: payloadChatId,
                chatMode: pendingChatMode,
                message: errorMessage,
                raw: framePayload
            });
            handleChatError({
                handlers: this.handlers,
                payloadChatId,
                pendingRequests: this.pendingRequests,
                raw: framePayload,
                requestId,
                socketError: ChatSocketError
            });
        }
    };

    private handleConnect = (): void => {
        this.isManualDisconnect = false;
        this.isReady = false;
        publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.connect, {
            chats: Array.from(this.joinedChatIds)
        });
    };

    private handleReady = (): void => {
        this.isReady = true;
        this.rejoinTrackedChats();
        publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.ready, {
            chats: Array.from(this.joinedChatIds)
        });
    };

    private handleDisconnect = (reason: string): void => {
        this.isReady = false;
        publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.disconnect, {
            reason
        });
        handleChatDisconnect({
            isManualDisconnect: this.isManualDisconnect,
            onDisconnect: () => {
                this.connectPromise = null;
                if (this.pendingRequests.size) {
                    this.rejectPendingRequests('Chat socket disconnected.', reason);
                }
            }
        });
    };

    private disposeSocket(socket: Socket): void {
        socket.removeAllListeners();
        socket.disconnect();
    }

    private ensureSocket(): Socket {
        if (this.socket) {
            return this.socket;
        }

        const { url, path } = this.getSocketConfig();
        const socket = io(url, {
            path,
            transports: ['websocket'],
            reconnection: true,
            autoConnect: false,
            auth: {
                token: this.tokens.accessToken
            }
        });

        this.socket = socket;
        registerChatSocketPage(() => this.disconnect());
        socket.on('connect', this.handleConnect);
        socket.on('chat:ready', this.handleReady);
        socket.on('chat:ack', (payload: unknown) => this.handleIncoming('chat:ack', payload));
        socket.on('chat:debug', (payload: unknown) => this.handleIncoming('chat:debug', payload));
        socket.on('chat:assistant:done', (payload: unknown) => this.handleIncoming('chat:assistant:done', payload));
        socket.on('chat:error', (payload: unknown) => this.handleIncoming('chat:error', payload));
        socket.on('message', (payload: unknown) => this.handleIncoming('message', payload));
        socket.on('disconnect', (reason: string) => this.handleDisconnect(reason));
        return socket;
    }

    async connect(): Promise<void> {
        if (this.socket?.connected && this.isReady) {
            return;
        }

        if (this.connectPromise) {
            return this.connectPromise;
        }

        const socket = this.ensureSocket();
        this.socket.auth = {
            token: this.tokens.accessToken
        };
        this.isManualDisconnect = false;

        this.connectPromise = new Promise<void>((resolve, reject) => {
            const onReady = (): void => {
                socket.off('connect_error', onConnectError);
                socket.off('chat:error', onChatError);
                resolve();
            };

            const onConnectError = (): void => {
                socket.off('chat:ready', onReady);
                socket.off('chat:error', onChatError);
                if (this.socket === socket) {
                    this.socket = null;
                }
                this.disposeSocket(socket);
                publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.connectError, {});
                reject(new ChatSocketError('Could not connect to chat socket.'));
            };

            const onChatError = (payload: unknown): void => {
                const error = payload as { error?: string } | null;
                socket.off('chat:ready', onReady);
                socket.off('connect_error', onConnectError);
                if (this.socket === socket) this.socket = null;
                this.disposeSocket(socket);
                reject(new ChatSocketError(error?.error || 'Chat socket authorization failed.'));
            };

            socket.once('chat:ready', onReady);
            socket.once('connect_error', onConnectError);
            socket.once('chat:error', onChatError);
            socket.connect();
        }).finally(() => {
            this.connectPromise = null;
        });

        return this.connectPromise;
    }

    disconnect(): void {
        if (this.socket) {
            this.isManualDisconnect = true;
            this.disposeSocket(this.socket);
        }

        this.socket = null;
        this.connectPromise = null;
        this.isReady = false;
        this.joinedChatIds.clear();

        const pendingEntries = Array.from(this.pendingRequests.values());
        this.pendingRequests.clear();
        pendingEntries.forEach((pending) => {
            window.clearTimeout(pending.timeoutId);
            pending.reject(new ChatSocketError('Chat socket disconnected.'));
        });
        publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.disconnectManual, {});
    }

    async join(chatId: string): Promise<void> {
        const normalizedChatId = this.trackChat(chatId);
        if (!normalizedChatId) {
            return;
        }

        await this.connect();
        this.joinConnectedChat(normalizedChatId);
    }

    async sendQuery(payload: AIChatQueryRequest): Promise<AIChatQueryData> {
        await this.connect();

        const requestId = payload.request_id || createRequestId();
        const outgoingPayload: AIChatQueryRequest = {
            ...payload,
            request_id: requestId
        };

        return new Promise<AIChatQueryData>((resolve, reject) => {
            if (!this.socket) {
                reject(new ChatSocketError('Chat socket not connected.'));
                return;
            }

            const timeoutId = window.setTimeout(() => {
                const pending = this.pendingRequests.get(requestId);
                if (!pending) return;
                publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.requestError, {
                    requestId,
                    chatId: pending.chatId,
                    chatMode: pending.chatMode,
                    stage: 'timeout',
                    message: 'Chat request timed out.'
                });
                this.pendingRequests.delete(requestId);
                reject(new ChatSocketError('Chat request timed out.'));
            }, CHAT_REQUEST_TIMEOUT_MS);

            this.pendingRequests.set(requestId, {
                chatId: this.normalizeChatId(payload.chat_id || null) || null,
                chatMode: typeof outgoingPayload.chat_mode === 'string' ? outgoingPayload.chat_mode : null,
                resolve,
                reject,
                timeoutId
            });

            publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.send, {
                requestId,
                chatId: String(outgoingPayload.chat_id || ''),
                chatMode: outgoingPayload.chat_mode,
                message: outgoingPayload.message
            });
            publishChatSocketPageEvent(CHAT_SOCKET_EVENT_TYPES.requestStart, {
                requestId,
                chatId: String(outgoingPayload.chat_id || ''),
                chatMode: outgoingPayload.chat_mode,
                stage: 'started',
                message: 'Chat request started.'
            });
            this.socket.emit('chat:send', {
                type: 'chat:send',
                payload: outgoingPayload
            });
        });
    }
}
