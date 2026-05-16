import assert from 'node:assert/strict';
import test from 'node:test';
import { createChatJoinHandler } from '../../src/chat/runtime/join-handle.socket';

const createSocket = () => {
  const emitted: Array<{ event: string; payload: unknown }> = [];
  const joined: string[] = [];
  const socket = {
    id: 'socket-1',
    rooms: new Set<string>(),
    emit: (event: string, payload: unknown) => emitted.push({ event, payload }),
    join: (room: string) => {
      joined.push(room);
      socket.rooms.add(room);
    },
    disconnect: () => undefined,
    emitted,
    joined,
  };
  return socket as any;
};

test('chat join handler joins room and emits joined payload', () => {
  const socket = createSocket();
  const handler = createChatJoinHandler({
    socket,
    logger: { info: () => undefined } as any,
    resolveContext: () =>
      ({
        userId: 'user-1',
        supabase: {},
      } as any),
  });

  handler({ chat_id: 'chat-1' });

  assert.deepEqual(socket.joined, ['chat:chat-1']);
  assert.deepEqual(socket.emitted, [{ event: 'chat:joined', payload: { chat_id: 'chat-1' } }]);
});
