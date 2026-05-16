import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getScopedLogger, toErrorMeta } from '@connectingmatrix/logger/lib/logger';
import { buildSocketSession } from '@connectingmatrix/sockets/core/build-session.socket';
import { resolveSocketSessionContext } from '@connectingmatrix/sockets/core/context.socket';
import { parseTokenFromHandshake } from '@connectingmatrix/sockets/core/auth-token.socket';
import { emitSocketEvent } from '@connectingmatrix/sockets/core/socket-telemetry.socket';
import { setChatSocketServer } from '../telemetry/event-bus';
import { createChatJoinHandler } from './join-handle.socket';
import { registerChatSendHandler } from './send-handle.socket';
import type { ChatSocketSessionContext } from '@giga/shared/types/contracts/chat.types';

const CHAT_SOCKET_PATH = '/ws/chat';
const logger = getScopedLogger('chat-socket');

export function setupChatSocketServer(server: HttpServer) {
  logger.info('chat.socket.server.starting', { path: CHAT_SOCKET_PATH });

  const io = new SocketIOServer(server, {
    path: CHAT_SOCKET_PATH,
    cors: {
      origin: '*',
    },
  });
  setChatSocketServer(io);

  io.on('connection', async (socket) => {
    // prettier-ignore
    logger.info('chat.socket.connection.opened', { path: socket.handshake.url || CHAT_SOCKET_PATH, ip: (socket.handshake.headers?.['x-forwarded-for'] as string) || socket.handshake.address || null, });

    try {
      const tokenPayload = parseTokenFromHandshake(socket);
      if (!tokenPayload) {
        emitSocketEvent({
          socket,
          logger,
          event: 'chat:error',
          payload: { error: 'Missing auth token.' },
          logEvent: 'chat.socket.emit.error',
          level: 'warn',
        });
        socket.disconnect(true);
        return;
      }

      const auth = await buildSocketSession(tokenPayload);
      socket.data.session = {
        userId: auth.userId,
        supabase: auth.supabase,
      };
    } catch (error: unknown) {
      logger.warn('chat.socket.connection.unauthorized', { error: toErrorMeta(error) });
      emitSocketEvent({
        socket,
        logger,
        event: 'chat:error',
        payload: { error: error instanceof Error ? error.message : 'Unauthorized' },
        logEvent: 'chat.socket.emit.error',
        level: 'warn',
      });
      socket.disconnect(true);
      return;
    }

    const resolveContext = (targetSocket: typeof socket) => resolveSocketSessionContext<ChatSocketSessionContext>(targetSocket);

    socket.on(
      'chat:join',
      createChatJoinHandler({
        logger,
        resolveContext,
        socket,
      }),
    );

    registerChatSendHandler({
      io,
      socket,
      logger,
      resolveContext,
    });

    emitSocketEvent({
      socket,
      logger,
      event: 'chat:ready',
      payload: {
        user_id: socket.data.session?.userId || null,
        path: CHAT_SOCKET_PATH,
      },
      logEvent: 'chat.socket.connection.ready',
      metadata: { user_id: socket.data.session?.userId || null },
    });

    socket.on('disconnect', (reason) => {
      logger.info('chat.socket.connection.closed', { reason });
    });
  });

  return io;
}
