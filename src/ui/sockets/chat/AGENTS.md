# src/socket/chat

## Purpose
Chat socket client events and payload types.

## Allowed Imports
- Socket core helpers and chat socket types.

## Forbidden Imports
- Screens, ORM internals, GraphQL client, and workflow execution code.

## Global Rules
- Product data flows only as Screen -> Dataloader -> ORM -> Backend.
- Do not add .gql or .graphql files; GraphQL strings live only in ORM, auth, or runtime infrastructure.
- Do not call fetch, graphqlRequest, or frontendGraphqlRequest from screens or components.
- Do not add mock fallbacks for product data. If the backend contract is broken, surface the exact failing operation.
- Do not create alternate CRUD paths, proxy files, shape-shifting helpers, or generated-output hand edits.
- Keep files focused and small; split by domain when a file grows beyond the local purpose.

## Local Rules
- Chat screens interact through chat dataloaders; socket modules only transport events.
- Chat mode contract:
    - Runtime selection is carried as `chat_mode` in `AIChatQueryRequest` with values `DEFAULT`, `AGENT`, `WORKFLOW`, `SWARM`.
    - Mode-specific ids are expected as `agent_id`, `workflow_id`, `swarm_id`.
    - SWARM and WORKFLOW mode must not be sent with placeholder ids (empty string or `'auto'`).
- Lifecycle event contract:
    - Request lifecycle events are emitted through `CHAT_SOCKET_EVENT_TYPES` using: `request:start`, `request:progress`, `request:done`, `request:error`.
    - UI/process observers should subscribe to `window` event `giga:chat-socket` and branch by these event types for run state.

## Validation
- Run yarn build after wiring changes.
- Run yarn test:orm when ORM metadata or query construction changes.
- Run yarn test:dataloaders when loaders, auth, or screen data contracts change.
