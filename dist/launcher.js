import { nowIso } from './contracts.js';
export function createConnectingmatrixSocketsStubLauncher(context = {}) {
    return {
        packageName: '@connectingmatrix/sockets',
        title: 'Sockets Launcher',
        mode: 'stub',
        status: 'ready',
        checkedAt: nowIso(),
        summary: 'Provides frontend/backend local socket rooms, broadcast/on/regester/register APIs, and logger emission bus.',
        healthPath: '/sockets/health',
        graphqlNamespace: 'sockets',
        routes: [
            { method: 'GET', path: '/sockets/health', description: 'Health/status endpoint' },
            { method: 'GET', path: '/sockets/launcher', description: 'Stub launcher panel' }
        ],
        owns: {
            ui: ['dataloaders', 'bindWithServer', 'status/launcher UI'],
            backend: ["Socket room runtime", "logger event emission"],
            entity: ["SocketRoom"],
            migrations: ['migrations/*.sql']
        },
        actions: [
            { name: 'register', label: 'register', method: 'LOCAL', description: 'Run register demo action' },
            { name: 'broadcast', label: 'broadcast', method: 'LOCAL', description: 'Run broadcast demo action' },
            { name: 'on', label: 'on', method: 'LOCAL', description: 'Run on demo action' },
            { name: 'emitLog', label: 'emitLog', method: 'LOCAL', description: 'Run emitLog demo action' }
        ],
        sampleData: { context: 'stub-playground', userId: context.userId ?? 'stub-user' },
        context: { userId: context.userId, organizationId: context.organizationId, root: Boolean(context.root), traceId: context.traceId },
        notes: [
            'This launcher is intentionally stub-mode playable so the package can be tested outside giga-ai-backend.',
            'The launcher exposes this package boundary only; cross-package behavior is injected through adapters.'
        ]
    };
}
export const createStubLauncher = createConnectingmatrixSocketsStubLauncher;
export const Launcher = { open: createConnectingmatrixSocketsStubLauncher, mode: 'stub' };
export const launcher = createConnectingmatrixSocketsStubLauncher;
