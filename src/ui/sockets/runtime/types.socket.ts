export type RuntimeMonitorKind = 'processes' | 'workflows' | 'agents' | 'swarms' | 'applications';
export type RuntimeMonitorMode = 'root' | 'orgAdmin' | 'user';
export type RuntimeStatus = 'running' | 'sleeping' | 'high-cpu' | 'stopped' | 'zombie' | 'active' | 'queued' | 'failed';
export type RuntimeLogLevel = 'INFO' | 'DEBUG' | 'WARN' | 'ERROR';

export type RuntimeSubscribeInput = {
    requestId: string;
    kind: RuntimeMonitorKind;
    organizationId?: string | null;
    userId?: string | null;
    first?: number | null;
    offset?: number | null;
    search?: string | null;
};

export type RuntimeMetricPayload = { label: string; value: string; tone: 'blue' | 'green' | 'purple' | 'red' | 'cyan'; points: number[] };
export type RuntimeUserPayload = { id: string; name: string; cpu: string; memory: string; processes: number; status: RuntimeStatus };
export type RuntimeProcessPayload = { id: string; parentId: string | null; userId?: string | null; name: string; icon: string; pid: string; cpu: string; memory: string; status: RuntimeStatus; depth: number };
export type RuntimeLogPayload = { id: string; time: string; process: string; pid: string; level: RuntimeLogLevel; message: string };

export type RuntimeMonitorPayload = {
    mode: RuntimeMonitorMode;
    kind: RuntimeMonitorKind;
    scopeLabel: string;
    metrics: RuntimeMetricPayload[];
    users: RuntimeUserPayload[];
    processes: RuntimeProcessPayload[];
    logs: RuntimeLogPayload[];
    updatedAt: string;
    uptime: string;
};

export type RuntimeEventPayload = {
    kind: 'agent.run' | 'workflow.run' | 'swarm.worker' | 'process.metric' | 'log.line' | 'approval.request' | 'approval.decision' | 'dataset.ingestion';
    status: string;
    agentId?: string | null;
    workflowId?: string | null;
    swarmId?: string | null;
    workerId?: string | null;
    runId?: string | null;
    pid?: number | null;
    cpu?: number | null;
    cpuPercent?: number | null;
    ramMb?: number | null;
    ramBytes?: number | null;
    message?: string | null;
    timestamp: string;
};

export type RuntimeSocketHandlers = {
    onSnapshot: (payload: RuntimeMonitorPayload) => void;
    onEvent?: (payload: RuntimeEventPayload) => void;
    onError?: (message: string) => void;
};
