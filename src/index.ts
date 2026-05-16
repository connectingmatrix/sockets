import { LocalEventBus, nowIso, type EventHandler, type PackageHealth, type PackageModule, type RequestContext } from './contracts.js';
import { PackageObservability } from './observability.js';
import { createPackageStatusPanel } from './services/package-status.service.js';

export interface SocketEnvelope<T = unknown> {
  room: string;
  event: string;
  payload: T;
  at: string;
  traceId?: string;
}

export interface SocketTransport {
  send(room: string, envelope: SocketEnvelope): Promise<void> | void;
  on?(room: string, handler: EventHandler<SocketEnvelope>): () => void;
}

export interface LoggerLike { setBroadcaster?: (fn: (payload: Record<string, unknown>) => void | Promise<void>) => unknown; bindSockets?: (socket: SocketRuntime) => unknown; }

class SocketRuntime {
  private readonly bus = new LocalEventBus();
  private transport?: SocketTransport;
  private readonly registeredRooms = new Set<string>();
  private trackingBroadcast = false;

  bindTransport(transport: SocketTransport): this { this.transport = transport; return this; }
  bindLogger(logger: LoggerLike): this { logger.bindSockets?.(this); logger.setBroadcaster?.(async (payload) => { await this.emitLog(payload); }); return this; }

  bindWithServer(endpoint: string): this {
    if (typeof WebSocket === 'undefined') return this;
    const socket = new WebSocket(endpoint);
    this.transport = { send: (_room, envelope) => { if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(envelope)); } };
    socket.addEventListener('message', (message) => {
      try { const envelope = JSON.parse(String(message.data)) as SocketEnvelope; void this.bus.emit(envelope.room, envelope); } catch { /* ignore malformed external socket payloads */ }
    });
    return this;
  }

  register(room: string): this { this.registeredRooms.add(room); return this; }
  regester(room: string): this { return this.register(room); }

  on<T = unknown>(room: string, handler: EventHandler<SocketEnvelope<T>>): () => void {
    this.register(room);
    const offLocal = this.bus.on(room, handler as EventHandler<unknown>);
    const offRemote = this.transport?.on?.(room, handler as EventHandler<SocketEnvelope>);
    return () => { offLocal(); offRemote?.(); };
  }

  async broadcast<T = unknown>(room: string, payload: T, event = 'message', traceId?: string): Promise<SocketEnvelope<T>> {
    this.register(room);
    const envelope: SocketEnvelope<T> = { room, event, payload, at: nowIso(), traceId };
    await this.bus.emit(room, envelope);
    await this.transport?.send(room, envelope);
    const isObservabilityRoom = room === 'logs' || room.startsWith('process-monitor') || room.startsWith('process-monitoring') || room.includes(':logs') || room.includes(':processes');
    if (!isObservabilityRoom) PackageObservability.track(`room:${room}`, { label: `Socket room ${room}`, status: 'running', progress: 100, context: { event } });
    return envelope;
  }

  async emitLog(payload: Record<string, unknown>): Promise<SocketEnvelope<Record<string, unknown>>> { return this.broadcast('logs', payload, 'log'); }
  async emitProcess(payload: Record<string, unknown>): Promise<SocketEnvelope<Record<string, unknown>>> { return this.broadcast('process-monitoring', payload, 'runtime.process'); }
  rooms(): string[] { return [...this.registeredRooms]; }
  health(): PackageHealth { return { name: '@connectingmatrix/sockets', status: 'ok', checkedAt: nowIso(), details: { rooms: this.rooms().length, transport: Boolean(this.transport), ...PackageObservability.healthDetails() } }; }
}

export const Socket = new SocketRuntime();
export const createPackage = (): PackageModule => ({
  name: '@connectingmatrix/sockets',
  version: '0.4.0',
  health: () => Socket.health(),
  launcher: createPackageStatusPanel,
  runtime: { Socket, observability: PackageObservability },
  routes: [
    { method: 'GET', path: '/sockets/health', handler: () => Socket.health() },
    { method: 'GET', path: '/sockets/rooms', handler: () => Socket.rooms() },
    { method: 'GET', path: '/sockets/launcher', handler: (request) => createPackageStatusPanel((request as { context?: RequestContext }).context ?? {}) },
  ],
});

export * from './contracts.js';
export * from './package-structure.js';
export * from './observability.js';
export * from './services/package-status.service.js';
