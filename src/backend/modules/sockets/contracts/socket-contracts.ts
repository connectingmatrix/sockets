import type { RoleGateContract, SocketEventContract } from '@giga/shared/types/contracts/integration-contract.types';

const roles: RoleGateContract[] = [
  { actor: 'User', canInvoke: true, constraints: ['JWT/session handshake required before chat/workflow events.'] },
  { actor: 'Root User', canInvoke: true, constraints: ['Root users may access elevated scoped chats/workflows where policy allows.'] },
  { actor: 'Super Admin', canInvoke: true, constraints: ['Super-admin policy and scope gates apply for cross-org channels.'] },
];

const chatSources = ['packages/apps/socket/src/chat/runtime/chat.socket.ts', 'packages/apps/socket/src/chat/runtime/send-handle.socket.ts'];
const workflowSources = ['packages/apps/socket/src/workflow/event-bus.ts'];

export const SOCKET_CONTRACTS: SocketEventContract[] = [
  {
    packageName: '@connectingmatrix/sockets',
    namespace: '/chat',
    event: 'chat:join',
    direction: 'client->server',
    description: 'Join chat room before sending/receiving streamed assistant responses.',
    payload: [{ name: 'chat_id', type: 'string', required: true, description: 'Chat id room key.' }],
    combinations: [{ name: 'join', required: ['chat_id'], optional: [], constraints: ['chat_id is mandatory.'] }],
    roleGates: roles,
    sourcePaths: chatSources,
    notes: ['Frontend should call join once after socket ready.'],
  },
  {
    packageName: '@connectingmatrix/sockets',
    namespace: '/chat',
    event: 'chat:send',
    direction: 'client->server',
    description: 'Send chat message with explicit mode and optional agent/workflow/swarm selectors.',
    payload: [
      { name: 'message', type: 'string', required: true, description: 'User message content.' },
      { name: 'chat_mode', type: 'DEFAULT|AGENT|WORKFLOW|SWARM', required: false, description: 'Execution mode selector.' },
      { name: 'agent_id', type: 'string', required: false, description: 'Required for AGENT mode.' },
      { name: 'workflow_id', type: 'string', required: false, description: 'Required for WORKFLOW mode.' },
      { name: 'swarm_id', type: 'string', required: false, description: 'Optional explicit swarm target.' },
      { name: 'request_id', type: 'string', required: false, description: 'Client correlation id.' },
    ],
    combinations: [
      { name: 'default-mode', required: ['message'], optional: ['chat_mode', 'request_id'], constraints: ['chat_mode omitted defaults to DEFAULT.'] },
      { name: 'agent-mode', required: ['message', 'chat_mode', 'agent_id'], optional: ['request_id'], constraints: ['chat_mode must be AGENT.'] },
      {
        name: 'workflow-mode',
        required: ['message', 'chat_mode', 'workflow_id'],
        optional: ['request_id'],
        constraints: ['chat_mode must be WORKFLOW.'],
      },
      { name: 'swarm-mode', required: ['message', 'chat_mode'], optional: ['swarm_id', 'request_id'], constraints: ['chat_mode must be SWARM.'] },
    ],
    roleGates: roles,
    sourcePaths: chatSources,
    notes: ['Server emits ack/debug/final/error events for each request_id flow.'],
  },
  {
    packageName: '@connectingmatrix/sockets',
    namespace: '/chat',
    event: 'chat:assistant:done',
    direction: 'server->client',
    description: 'Final chat response payload event.',
    payload: [{ name: 'data', type: 'ChatQueryPayload', required: true, description: 'Chat and messages payload.' }],
    combinations: [
      { name: 'result', required: ['data'], optional: ['request_id'], constraints: ['Result is emitted to joined chat room and sender socket.'] },
    ],
    roleGates: roles,
    sourcePaths: chatSources,
    notes: ['Use with chat:debug for progressive state and chat:error for failures.'],
  },
  {
    packageName: '@connectingmatrix/sockets',
    namespace: '/workflow',
    event: 'workflow:event',
    direction: 'broadcast',
    description: 'Workflow execution lifecycle events published to workflow rooms.',
    payload: [{ name: 'event', type: 'record', required: true, description: 'Workflow runtime event payload.' }],
    combinations: [
      {
        name: 'workflow-run',
        required: ['event'],
        optional: [],
        constraints: ['Delivered to workflow execution room derived from workflow/broadcast ids.'],
      },
    ],
    roleGates: roles,
    sourcePaths: workflowSources,
    notes: ['Used for workflow execution live status in frontend runners.'],
  },
  {
    packageName: '@connectingmatrix/sockets',
    namespace: '/workflow',
    event: 'workflow:execution:update',
    direction: 'broadcast',
    description: 'Workflow execution status snapshots for catalog/list views.',
    payload: [{ name: 'execution', type: 'record', required: true, description: 'Execution row status snapshot.' }],
    combinations: [
      {
        name: 'catalog-status',
        required: ['execution'],
        optional: [],
        constraints: ['Broadcast channel is derived from workflow broadcast id and channel name.'],
      },
    ],
    roleGates: roles,
    sourcePaths: workflowSources,
    notes: ['Use for live execution badge updates in workflow UI grids.'],
  },
];

export const NO_SOCKET_SURFACE_REASON = '';
