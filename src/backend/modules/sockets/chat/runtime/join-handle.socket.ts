import { toChatRoomName } from './chat-room.socket';
import type { Socket } from 'socket.io';
import type { ChatSocketLogger, ChatSocketSessionContext } from '@giga/shared/types/contracts/chat.types';

export const createChatJoinHandler = (params: {
  logger: ChatSocketLogger;
  resolveContext: (socket: Socket) => ChatSocketSessionContext | null;
  socket: Socket;
}) => {
  const { logger, resolveContext, socket } = params;
  return (payload: { chat_id?: string } = {}) => {
    const context = resolveContext(socket);
    if (!context) {
      socket.emit('chat:error', { error: 'Unauthorized socket context.' });
      socket.disconnect(true);
      return;
    }

    const chatId = String(payload?.chat_id || '').trim();
    if (!chatId) {
      socket.emit('chat:error', {
        error: 'chat_id is required for chat:join.',
      });
      return;
    }

    socket.join(toChatRoomName(chatId));
    logger.info('chat.socket.room.joined', { user_id: context.userId, chat_id: chatId });
    socket.emit('chat:joined', { chat_id: chatId });
  };
};
