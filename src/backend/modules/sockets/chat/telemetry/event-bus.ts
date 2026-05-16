import { Server as SocketIOServer } from 'socket.io';
import { toChatRoomName } from '../runtime/chat-room.socket';

let chatSocketServer: SocketIOServer | null = null;

export const setChatSocketServer = (server: SocketIOServer): void => {
  chatSocketServer = server;
};

export const clearChatSocketServer = (): void => {
  chatSocketServer = null;
};

export const getChatSocketServer = (): SocketIOServer | null => chatSocketServer;

export const emitChatRoomEventIfAvailable = (chatId: string, event: string, payload: Record<string, unknown>): boolean => {
  if (!chatSocketServer) return false;
  chatSocketServer.to(toChatRoomName(chatId)).emit(event, payload);
  return true;
};

export const emitChatRoomEvent = (chatId: string, event: string, payload: Record<string, unknown>): void => {
  if (emitChatRoomEventIfAvailable(chatId, event, payload)) return;
  throw new Error('Chat socket server is not available.');
};
