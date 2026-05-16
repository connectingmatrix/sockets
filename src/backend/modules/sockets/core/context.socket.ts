import type { Socket } from 'socket.io';

export const resolveSocketSessionContext = <TContext>(socket: Socket): TContext | null => (socket.data?.session as TContext) || null;
