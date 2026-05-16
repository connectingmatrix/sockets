import { Server as SocketIOServer, Socket } from 'socket.io';
import { toErrorMeta } from '@connectingmatrix/logger/lib/logger';
import { GigaORM } from '@connectingmatrix/orm/orm/giga-orm-v2';
import { createLifecycleState, markLifecycle } from '@connectingmatrix/logger/lifecycle-jsonl';
import { queryChat } from '@connectingmatrix/chat/services/chat/read/query-chat';
import { normalizeChatSendPayload } from '../io/normalize-send-payload.socket';
import { toChatRoomName } from './chat-room.socket';
import type {
  ChatScopeType,
  ChatSendPayload,
  ChatSocketLogger,
  ChatSocketSessionContext,
  SocketEventEnvelope,
} from '@giga/shared/types/contracts/chat.types';

const socketErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Failed to process chat message.');
const findCtorPath = (value: unknown, ctorName: string, path = 'root', seen = new WeakSet<object>()): string | null => {
  if (!value || typeof value !== 'object') return null;
  if ((value as { constructor?: { name?: string } }).constructor?.name === ctorName) return path;
  if (seen.has(value as object)) return null;
  seen.add(value as object);
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const found = findCtorPath(child, ctorName, `${path}.${key}`, seen);
    if (found) return found;
  }
  return null;
};

const emitAck = (socket: Socket, requestId?: string | null) => {
  socket.emit('chat:ack', { request_id: requestId || null, status: 'accepted' });
};

const emitError = (socket: Socket, input: { error: string; requestId?: string | null }) => {
  socket.emit('chat:error', { request_id: input.requestId || null, error: input.error });
};

const emitDebug = (params: { chatId?: string | null; io: SocketIOServer; payload: Record<string, unknown>; socket: Socket }) => {
  const resolvedChatId = String(params.chatId || '').trim();
  if (!resolvedChatId) {
    params.socket.emit('chat:debug', params.payload);
    return;
  }
  const room = toChatRoomName(resolvedChatId);
  params.io.to(room).emit('chat:debug', params.payload);
  if (!params.socket.rooms.has(room)) params.socket.emit('chat:debug', params.payload);
};

const emitDone = (params: { chatId?: string | null; io: SocketIOServer; payload: Record<string, unknown>; socket: Socket }) => {
  const resolvedChatId = String(params.chatId || '').trim();
  if (!resolvedChatId) {
    params.socket.emit('chat:assistant:done', params.payload);
    return;
  }
  params.io.to(toChatRoomName(resolvedChatId)).emit('chat:assistant:done', params.payload);
};

const normalizeScope = (payload: ChatSendPayload) => {
  const rawScopeType = String(payload?.scope?.type || '')
    .trim()
    .toLowerCase();
  const rawScopeId = String(payload?.scope?.id || '').trim();
  if (!rawScopeType && !rawScopeId) return undefined;
  if (!rawScopeType || !rawScopeId) throw new Error('scope.type and scope.id are required together.');
  if (
    rawScopeType !== 'channel' &&
    rawScopeType !== 'category' &&
    rawScopeType !== 'subject' &&
    rawScopeType !== 'post' &&
    rawScopeType !== 'temporary'
  ) {
    throw new Error('Invalid chat scope type.');
  }
  return { type: rawScopeType as ChatScopeType, id: rawScopeId, organizationId: String(payload?.scope?.organizationId || '').trim() || null };
};

const stringList = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const requireContext = (params: {
  logger: ChatSocketLogger;
  resolveContext: (socket: Socket) => ChatSocketSessionContext | null;
  socket: Socket;
}) => {
  const context = params.resolveContext(params.socket);
  if (context) return context;
  params.logger.warn('chat.socket.message.missing_context', { event_type: 'chat:send' });
  emitError(params.socket, { error: 'Unauthorized socket context.' });
  params.socket.disconnect(true);
  return null;
};

export const registerChatSendHandler = (params: {
  io: SocketIOServer;
  logger: ChatSocketLogger;
  resolveContext: (socket: Socket) => ChatSocketSessionContext | null;
  socket: Socket;
}) => {
  const { io, logger, resolveContext, socket } = params;
  socket.on('chat:send', async (rawPayload: ChatSendPayload | SocketEventEnvelope<ChatSendPayload> = {}) => {
    const payload = normalizeChatSendPayload(rawPayload);
    const context = requireContext({ logger, resolveContext, socket });
    if (!context) return;
    const requestId = String(payload?.request_id || '').trim() || null;
    const lifecycleState = createLifecycleState(requestId || `socket-${socket.id}-${Date.now()}`);
    const chatId = String(payload?.chat_id || '').trim() || undefined;
    const message = String(payload?.message || '').trim();
    markLifecycle(lifecycleState, { layer: 'socket.chat', event: 'chat.send', phase: 'start', transport: 'socket' });
    try {
      const scope = normalizeScope(payload);
      const subjectIds = stringList(payload?.subject_ids);
      const subjectId = payload?.subject_id ? String(payload.subject_id).trim() : undefined;
      const postId = payload?.post_id ? String(payload.post_id).trim() : undefined;
      const topK = payload?.top_k ? Number(payload.top_k) : undefined;
      if (!message) throw new Error('message is required for chat:send.');
      if (scope && (postId || subjectId || subjectIds?.length)) throw new Error('Use scope or legacy subject/post fields for chat scope, not both.');
      if (postId && (subjectId || subjectIds?.length)) throw new Error('Use subject_ids or post_id for chat scope, not both.');
      emitAck(socket, requestId);
      emitDebug({
        io,
        socket,
        chatId,
        payload: {
          request_id: requestId,
          chat_id: chatId || null,
          stage: 'chat.send',
          status: 'started',
          message: 'Message accepted, starting processing pipeline.',
          timestamp: new Date().toISOString(),
          meta: {
            message_chars: message.length,
            scope_type: scope?.type || null,
            scope_id: scope?.id || null,
            subject_ids_count: subjectIds?.length || 0,
            has_post_id: Boolean(postId),
          },
        },
      });
      const acceptedMeta = {
        request_id: requestId,
        user_id: context.userId,
        chat_id: chatId || null,
        message_chars: message.length,
        scope_type: scope?.type || null,
        scope_id: scope?.id || null,
      };
      logger.info('chat.socket.chat_send.accepted', acceptedMeta);
      const result = await GigaORM.run(
        {
          caller: { id: context.userId, type: 'user' },
          scope: { id: context.userId, type: 'user' },
          meta: {
            request: socket.request as unknown as Record<string, unknown>,
            supabase: context.supabase as unknown as Record<string, unknown>,
          },
        },
        () =>
          queryChat({
            supabase: context.supabase,
            request: socket.request,
            chatId,
            attachments: Array.isArray(payload?.attachments) ? payload.attachments : undefined,
            chatExecutionMode: typeof payload?.chat_execution_mode === 'string' ? payload.chat_execution_mode : undefined,
            scope,
            message,
            subjectId,
            subjectIds,
            postId,
            topK,
            tagSlugs: Array.isArray(payload?.tag_slugs) ? payload.tag_slugs : undefined,
            subjectQuery: typeof payload?.subject_query === 'string' ? payload.subject_query : undefined,
            systemPrompt: typeof payload?.system_prompt === 'string' ? payload.system_prompt : undefined,
            agentId:
              String(payload?.agent_id || payload?.agentId || payload?.selected_agent_id || payload?.selectedAgentId || '').trim() || undefined,
            chatMode: String(payload?.chat_mode || payload?.chatMode || 'DEFAULT').trim() || undefined,
            workflowId: String(payload?.workflow_id || payload?.workflowId || payload?.selected_workflow_id || '').trim() || undefined,
            swarmId: String(payload?.swarm_id || payload?.swarmId || payload?.selected_swarm_id || '').trim() || undefined,
            sessionMetadata: payload?.session_metadata && typeof payload.session_metadata === 'object' ? payload.session_metadata : undefined,
            debug: {
              requestId,
              emit: (debugEvent) => {
                emitDebug({
                  io,
                  socket,
                  chatId: debugEvent.chat_id || chatId || null,
                  payload: {
                    request_id: requestId,
                    chat_id: debugEvent.chat_id || chatId || null,
                    stage: debugEvent.stage,
                    status: debugEvent.status,
                    message: debugEvent.message,
                    timestamp: debugEvent.timestamp || new Date().toISOString(),
                    meta: debugEvent.meta || {},
                  },
                });
              },
            },
          }),
      );
      const resolvedChatId = String((result as { chat?: { id?: string | null } })?.chat?.id || '').trim() || null;
      if (resolvedChatId) socket.join(toChatRoomName(resolvedChatId));
      emitDebug({
        io,
        socket,
        chatId: resolvedChatId || chatId || null,
        payload: {
          request_id: requestId,
          chat_id: resolvedChatId || chatId || null,
          stage: 'chat.send',
          status: 'completed',
          message: 'Message processing completed.',
          timestamp: new Date().toISOString(),
          meta: {
            retrieved_chunks: (result as { debug?: { retrieved_chunks?: number } })?.debug?.retrieved_chunks || 0,
            actions_count: (result as { agent?: { action_results?: unknown[] } })?.agent?.action_results?.length || 0,
          },
        },
      });
      try {
        JSON.stringify(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error || 'Chat result is not serializable.');
        const supabasePath = findCtorPath(result, 'SupabaseAuthClient');
        const nonSerializableMeta = {
          request_id: requestId,
          user_id: context.userId,
          chat_id: resolvedChatId || chatId || null,
          error: message,
          supabase_path: supabasePath,
        };
        logger.error('chat.socket.chat_send.non_serializable_result', nonSerializableMeta);
        throw new Error(message);
      }
      emitDone({ io, socket, chatId: resolvedChatId, payload: { request_id: requestId, data: result as Record<string, unknown> } });
      const completedMeta = {
        request_id: requestId,
        user_id: context.userId,
        chat_id: resolvedChatId || chatId || null,
        retrieved_chunks: (result as { debug?: { retrieved_chunks?: number } })?.debug?.retrieved_chunks || 0,
      };
      logger.info('chat.socket.chat_send.completed', completedMeta);
      markLifecycle(lifecycleState, {
        layer: 'socket.chat',
        event: 'chat.send',
        phase: 'end',
        transport: 'socket',
        status: 'passed',
        meta: { chat_id: resolvedChatId || null },
      });
    } catch (error: unknown) {
      emitDebug({
        io,
        socket,
        chatId: chatId || null,
        payload: {
          request_id: requestId,
          chat_id: chatId || null,
          stage: 'chat.send',
          status: 'failed',
          message: socketErrorMessage(error),
          timestamp: new Date().toISOString(),
        },
      });
      const failedMeta = {
        request_id: requestId,
        user_id: context.userId,
        chat_id: chatId || null,
        error: toErrorMeta(error),
      };
      logger.error('chat.socket.chat_send.failed', failedMeta);
      emitError(socket, { requestId, error: socketErrorMessage(error) });
      markLifecycle(lifecycleState, { layer: 'socket.chat', event: 'chat.send', phase: 'error', transport: 'socket', status: 'failed' });
    }
  });
};
