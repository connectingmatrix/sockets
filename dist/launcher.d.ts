import { type PackageLauncherPanel, type RequestContext } from './contracts.js';
export declare function createConnectingmatrixSocketsStubLauncher(context?: RequestContext): PackageLauncherPanel;
export declare const createStubLauncher: typeof createConnectingmatrixSocketsStubLauncher;
export declare const Launcher: {
    open: typeof createConnectingmatrixSocketsStubLauncher;
    mode: "stub";
};
export declare const launcher: typeof createConnectingmatrixSocketsStubLauncher;
