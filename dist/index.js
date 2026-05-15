import { LocalEventBus, nowIso } from './contracts.js';
class SocketRuntime {
    constructor() {
        this.bus = new LocalEventBus();
        this.registeredRooms = new Set();
    }
    bindTransport(transport) {
        this.transport = transport;
        return this;
    }
    bindWithServer(endpoint) {
        if (typeof WebSocket === 'undefined')
            return this;
        const socket = new WebSocket(endpoint);
        this.transport = {
            send: (_room, envelope) => { if (socket.readyState === socket.OPEN)
                socket.send(JSON.stringify(envelope)); },
        };
        socket.addEventListener('message', (message) => {
            try {
                const envelope = JSON.parse(String(message.data));
                void this.bus.emit(envelope.room, envelope);
            }
            catch {
                // ignore malformed external socket payloads
            }
        });
        return this;
    }
    register(room) {
        this.registeredRooms.add(room);
        return this;
    }
    /** Backward-compatible typo from the original API request. */
    regester(room) {
        return this.register(room);
    }
    on(room, handler) {
        this.register(room);
        const offLocal = this.bus.on(room, handler);
        const offRemote = this.transport?.on?.(room, handler);
        return () => {
            offLocal();
            offRemote?.();
        };
    }
    async broadcast(room, payload, event = 'message', traceId) {
        this.register(room);
        const envelope = { room, event, payload, at: nowIso(), traceId };
        await this.bus.emit(room, envelope);
        await this.transport?.send(room, envelope);
        return envelope;
    }
    async emitLog(payload) {
        return this.broadcast('logs', payload, 'log');
    }
    rooms() {
        return [...this.registeredRooms];
    }
    health() {
        return { name: '@connectingmatrix/sockets', status: 'ok', checkedAt: nowIso(), details: { rooms: this.rooms().length, transport: Boolean(this.transport) } };
    }
}
export const Socket = new SocketRuntime();
export const createPackage = () => ({
    name: '@connectingmatrix/sockets',
    version: '0.1.0',
    health: () => Socket.health(),
    routes: [
        { method: 'GET', path: '/sockets/health', handler: () => Socket.health() },
    ],
});
export * from './contracts.js';
