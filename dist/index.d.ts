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
declare class SocketRuntime {
    private readonly bus;
    private transport?;
    private readonly registeredRooms;
    bindTransport(transport: SocketTransport): this;
    bindWithServer(endpoint: string): this;
    register(room: string): this;
    /** Backward-compatible typo from the original API request. */
    regester(room: string): this;
    on<T = unknown>(room: string, handler: EventHandler<SocketEnvelope<T>>): () => void;
    broadcast<T = unknown>(room: string, payload: T, event?: string, traceId?: string): Promise<SocketEnvelope<T>>;
    emitLog(payload: Record<string, unknown>): Promise<SocketEnvelope<Record<string, unknown>>>;
    rooms(): string[];
    health(): PackageHealth;
}
export declare const Socket: SocketRuntime;
export declare const createPackage: () => PackageModule;
export * from './contracts.js';
