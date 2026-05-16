import { io, Socket } from 'socket.io-client';
import { API_ORIGIN, RUNTIME_WS_URL } from '@giga/dataloader/client/legacy/graphql/env';
import { resolveSocketConfig } from '../core/socket-url';
import type { RuntimeEventPayload, RuntimeMonitorPayload, RuntimeSocketHandlers, RuntimeSubscribeInput } from './types.socket';

type RuntimeSubscribedFrame = { subscriptionId: string; snapshot: RuntimeMonitorPayload };
type RuntimeSnapshotFrame = { payload: RuntimeMonitorPayload };
type RuntimeEventFrame = { event: RuntimeEventPayload };
type RuntimeErrorFrame = { message?: string; error?: string };

export class RuntimeMonitorSocketClient {
    private socket: Socket | null = null;

    public constructor(private readonly token: string) {}

    public subscribe(input: RuntimeSubscribeInput, handlers: RuntimeSocketHandlers): () => void {
        const { url, path } = resolveSocketConfig(RUNTIME_WS_URL, { url: API_ORIGIN, path: '/ws/runtime' });
        const socket = io(url, { path, transports: ['websocket'], auth: { token: this.token } });
        let subscriptionId = '';
        this.socket = socket;
        socket.on('connect', () => socket.emit('runtime:subscribe', input));
        socket.on('runtime:subscribed', (frame: RuntimeSubscribedFrame) => {
            subscriptionId = frame.subscriptionId;
            handlers.onSnapshot(frame.snapshot);
        });
        socket.on('runtime:snapshot', (frame: RuntimeSnapshotFrame) => handlers.onSnapshot(frame.payload));
        socket.on('runtime:event', (frame: RuntimeEventFrame) => handlers.onEvent?.(frame.event));
        socket.on('runtime:error', (frame: RuntimeErrorFrame) => handlers.onError?.(frame.message || frame.error || 'Runtime monitor socket error.'));
        return () => {
            if (subscriptionId) socket.emit('runtime:unsubscribe', { subscriptionId });
            socket.removeAllListeners();
            socket.disconnect();
            if (this.socket === socket) this.socket = null;
        };
    }
}
