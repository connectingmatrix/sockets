import { LocalEventBus, nowIso } from './contracts.js';
import { PackageObservability } from './observability.js';
import { createPackageStatusPanel } from './services/package-status.service.js';
class SocketRuntime {
    constructor() {
        this.bus = new LocalEventBus();
        this.registeredRooms = new Set();
        this.trackingBroadcast = false;
    }
    bindTransport(transport) { this.transport = transport; return this; }
    bindLogger(logger) { logger.bindSockets?.(this); logger.setBroadcaster?.(async (payload) => { await this.emitLog(payload); }); return this; }
    bindWithServer(endpoint) {
        if (typeof WebSocket === 'undefined')
            return this;
        const socket = new WebSocket(endpoint);
        this.transport = { send: (_room, envelope) => { if (socket.readyState === socket.OPEN)
                socket.send(JSON.stringify(envelope)); } };
        socket.addEventListener('message', (message) => {
            try {
                const envelope = JSON.parse(String(message.data));
                void this.bus.emit(envelope.room, envelope);
            }
            catch { /* ignore malformed external socket payloads */ }
        });
        return this;
    }
    register(room) { this.registeredRooms.add(room); return this; }
    regester(room) { return this.register(room); }
    on(room, handler) {
        this.register(room);
        const offLocal = this.bus.on(room, handler);
        const offRemote = this.transport?.on?.(room, handler);
        return () => { offLocal(); offRemote?.(); };
    }
    async broadcast(room, payload, event = 'message', traceId) {
        this.register(room);
        const envelope = { room, event, payload, at: nowIso(), traceId };
        await this.bus.emit(room, envelope);
        await this.transport?.send(room, envelope);
        const isObservabilityRoom = room === 'logs' || room.startsWith('process-monitor') || room.startsWith('process-monitoring') || room.includes(':logs') || room.includes(':processes');
        if (!isObservabilityRoom)
            PackageObservability.track(`room:${room}`, { label: `Socket room ${room}`, status: 'running', progress: 100, context: { event } });
        return envelope;
    }
    async emitLog(payload) { return this.broadcast('logs', payload, 'log'); }
    async emitProcess(payload) { return this.broadcast('process-monitoring', payload, 'runtime.process'); }
    rooms() { return [...this.registeredRooms]; }
    health() { return { name: '@connectingmatrix/sockets', status: 'ok', checkedAt: nowIso(), details: { rooms: this.rooms().length, transport: Boolean(this.transport), ...PackageObservability.healthDetails() } }; }
}
export const Socket = new SocketRuntime();
export const createPackage = () => ({
    name: '@connectingmatrix/sockets',
    version: '0.4.0',
    health: () => Socket.health(),
    launcher: createPackageStatusPanel,
    runtime: { Socket, observability: PackageObservability },
    routes: [
        { method: 'GET', path: '/sockets/health', handler: () => Socket.health() },
        { method: 'GET', path: '/sockets/rooms', handler: () => Socket.rooms() },
        { method: 'GET', path: '/sockets/launcher', handler: (request) => createPackageStatusPanel(request.context ?? {}) },
    ],
});
export * from './contracts.js';
export * from './package-structure.js';
export * from './observability.js';
export * from './services/package-status.service.js';
