import { type EventHandler, type PackageHealth, type PackageModule } from './contracts.js';
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
export interface LoggerLike {
    setBroadcaster?: (fn: (payload: Record<string, unknown>) => void | Promise<void>) => unknown;
    bindSockets?: (socket: SocketRuntime) => unknown;
}
declare class SocketRuntime {
    private readonly bus;
    private transport?;
    private readonly registeredRooms;
    private trackingBroadcast;
    bindTransport(transport: SocketTransport): this;
    bindLogger(logger: LoggerLike): this;
    bindWithServer(endpoint: string): this;
    register(room: string): this;
    regester(room: string): this;
    on<T = unknown>(room: string, handler: EventHandler<SocketEnvelope<T>>): () => void;
    broadcast<T = unknown>(room: string, payload: T, event?: string, traceId?: string): Promise<SocketEnvelope<T>>;
    emitLog(payload: Record<string, unknown>): Promise<SocketEnvelope<Record<string, unknown>>>;
    emitProcess(payload: Record<string, unknown>): Promise<SocketEnvelope<Record<string, unknown>>>;
    rooms(): string[];
    health(): PackageHealth;
}
export declare const Socket: SocketRuntime;
export declare const createPackage: () => PackageModule;
export * from './contracts.js';
export * from './package-structure.js';
export * from './observability.js';
export * from './services/package-status.service.js';
