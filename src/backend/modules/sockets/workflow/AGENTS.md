# AGENTS.md

## Directory Context

- Path: `packages/apps/socket/src/workflow`
- This folder owns the production code files in this folder.

## Contract

- Keep all code in this folder aligned with its layer package boundary.
- If any production code file in this folder is updated, update this AGENTS.md in the same change.
- This AGENTS file must document each owned file purpose, input/output shape, role rules, logic gates, functions, exports, and line snippets.

## File Usage Specification

### `editor-presence.ts`
- Purpose: Defines module behavior owned by this usage folder.
- Owning use cases: Runtime and application flows that import this file through package boundaries.
- Input shape: Typed arguments and imported contracts declared in this file signatures.
- Output shape: Typed return values, thrown errors, and exported contracts declared in this file.
- Role interaction rules:
  - `User`: Allowed through explicit service/resolver authorization and scoped data access only.
  - `Root User`: Can execute elevated flows where caller context resolves root privileges.
  - `Super Admin`: Can execute organization-level privileged flows where membership and role gates pass.
- Logic gates summary:
  - Authorization and scope checks must run before read/write side effects.
  - Entity/ORM boundaries must remain the source of persisted data access.
  - MCP or GraphQL proxy boundaries must avoid duplicated domain validation.
- Functions (all):
  - `registerWorkflowEditorSession` (L9-L9, function)
  - `heartbeatWorkflowEditorSession` (L55-L55, function)
  - `getWorkflowEditorSession` (L72-L72, function)
  - `closeWorkflowEditorSession` (L76-L76, function)
  - `closeWorkflowEditorSessionBySocket` (L87-L87, function)
  - `createPendingWebhookTestRequest` (L100-L100, function)
  - `resolvePendingWebhookTestRequest` (L121-L121, function)
  - `rejectPendingWebhookTestRequest` (L132-L132, function)
- Exports:
  - `registerWorkflowEditorSession` (L9)
  - `heartbeatWorkflowEditorSession` (L55)
  - `getWorkflowEditorSession` (L72)
  - `closeWorkflowEditorSession` (L76)
  - `closeWorkflowEditorSessionBySocket` (L87)
  - `createPendingWebhookTestRequest` (L100)
  - `resolvePendingWebhookTestRequest` (L121)
  - `rejectPendingWebhookTestRequest` (L132)
- Key snippets and use-case mapping:
  - `L9-L9`: Implements `registerWorkflowEditorSession` for this module use case.
  - `L55-L55`: Implements `heartbeatWorkflowEditorSession` for this module use case.
  - `L72-L72`: Implements `getWorkflowEditorSession` for this module use case.
  - `L76-L76`: Implements `closeWorkflowEditorSession` for this module use case.
  - `L87-L87`: Implements `closeWorkflowEditorSessionBySocket` for this module use case.
  - `L100-L100`: Implements `createPendingWebhookTestRequest` for this module use case.
  - `L121-L121`: Implements `resolvePendingWebhookTestRequest` for this module use case.
  - `L132-L132`: Implements `rejectPendingWebhookTestRequest` for this module use case.
### `event-bus.ts`
- Purpose: Defines module behavior owned by this usage folder.
- Owning use cases: Runtime and application flows that import this file through package boundaries.
- Input shape: Typed arguments and imported contracts declared in this file signatures.
- Output shape: Typed return values, thrown errors, and exported contracts declared in this file.
- Role interaction rules:
  - `User`: Allowed through explicit service/resolver authorization and scoped data access only.
  - `Root User`: Can execute elevated flows where caller context resolves root privileges.
  - `Super Admin`: Can execute organization-level privileged flows where membership and role gates pass.
- Logic gates summary:
  - Authorization and scope checks must run before read/write side effects.
  - Entity/ORM boundaries must remain the source of persisted data access.
  - MCP or GraphQL proxy boundaries must avoid duplicated domain validation.
- Functions (all):
  - `getWorkflowUserRoom` (L4-L4, arrow)
  - `getWorkflowRunRoom` (L5-L5, arrow)
  - `getWorkflowBroadcastRoom` (L6-L6, arrow)
  - `getWorkflowExecutionRoom` (L7-L7, arrow)
  - `emitWorkflowLogEvent` (L9-L9, arrow)
  - `emitWorkflowExecutionUpdate` (L33-L33, arrow)
- Exports:
  - `getWorkflowUserRoom` (L4)
  - `getWorkflowRunRoom` (L5)
  - `getWorkflowBroadcastRoom` (L6)
  - `getWorkflowExecutionRoom` (L7)
  - `emitWorkflowLogEvent` (L9)
  - `emitWorkflowExecutionUpdate` (L33)
- Key snippets and use-case mapping:
  - `L4-L4`: Implements `getWorkflowUserRoom` for this module use case.
  - `L5-L5`: Implements `getWorkflowRunRoom` for this module use case.
  - `L6-L6`: Implements `getWorkflowBroadcastRoom` for this module use case.
  - `L7-L7`: Implements `getWorkflowExecutionRoom` for this module use case.
  - `L9-L9`: Implements `emitWorkflowLogEvent` for this module use case.
  - `L33-L33`: Implements `emitWorkflowExecutionUpdate` for this module use case.

## Non-Negotiable Coding Standards

- Never ever write supabase.from we have entities always load data through it
- Do not use `supabase.from` or `input.from` directly. Load data through entities and the ORM.
- Do not add autofills
- Do not add placeholder, do not add normalisation.
- Find and fix the root cause instead of adding the fallback.
- Do not add fallbacks. Fix the logic.
- Everything should be typed dont use unknown, never, any
- Do not use JS-style safe/coercion helper functions.
- Do not use `to*` functions like `toPayload`.
- Do not create map functions.
- Do not check types like `type === Array` or `type === string`.
- Use the `||` operator for comparison.
- Do not write a code file bigger than 70-100 lines.
- Try to generalise multiple lines of code into fewer lines.
- After writing code, recheck patterns across the workspace to remove duplications.
- Do not invent functionality. Ask the user if it already exists somewhere.
- Prefer the smallest correct change over broad refactors.
- Preserve the repo's existing style, structure, and package manager.
- Avoid destructive git commands unless explicitly requested.
- Keep memory entries concise, factual, and tied to the files or behavior that changed.
- Entity table name should come from the Entity and not direct usage.
- Function naming should be .create, .delete .find .update .find .findBy .deleteBy
- Disallowed naming conventions are createRows, listRows and any programatic name for the entity.
- Importing supabase in the entities is disallowed. Upgrade the ORM file is something is not supported by entity. Orm is present at @gigav2/orm
- If Create, Update, Delete, Find is unable to do any thing stop the coding and inform the user of your updates first.
- Do not create proxy or additional functions for create, update, delete
- Keep ORM generic do not add Entity functions in the ORM
- MCP.ts will execute inner graphql for the operations they will not implement any
- JSON is disallowed in the Graphql Schema use proper types only
- Dont use zod for typing
