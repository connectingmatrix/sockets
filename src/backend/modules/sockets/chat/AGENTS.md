# Chat Socket Contracts

## Folder Purpose

- Own all chat socket transport and receive/send mapping.
- Keep routing thin; delegate mode execution and side effects to services.

## Non-Negotiable Contract

- `chat:send` input is routed through `chat_mode` as the mode signal:
  - `DEFAULT`
  - `AGENT`
  - `WORKFLOW`
  - `SWARM`
- Type-compatible id fields:
  - `agent_id` used only for `AGENT`
  - `workflow_id` used only for `WORKFLOW`
  - `swarm_id` used only for `SWARM`
- `chat_mode` defaults to `DEFAULT` only when absent.

## Socket Event Contract (UI-facing)

- Server emits:
  - `chat:ack` with `request_id`, `status: accepted`.
  - `chat:debug` with `{ request_id, chat_id, stage, status, message, timestamp, meta }`.
  - `chat:assistant:done` with `{ request_id, data: { chat, messages } }`.
  - `chat:error` with `{ request_id, error }`.
- Send handlers must not mutate message payload shape for these events.

## Runtime Monitoring Bridge

- UI monitor bridge should subscribe to UI-side lifecycle events derived from socket request handling:
  - `request:start`, `request:progress`, `request:done`, `request:error`.
- Keep these event names aligned with `src/socket/chat/page-events` in the UI package.

## Local Rules

- No new alternate transport path for chat routing; all UI/chat mode execution enters here first.
- Do not add fallback mode interpretation beyond validating requested mode.
- Keep `chat`/`workflow`/`agent` socket contracts unchanged by this layer.

## Validation

- Run backend socket/chat test fixtures when transport or payload shape changes.
- Run `yarn test` after meaningful socket contract edits.

- If any production code file in this folder is updated, update this AGENTS.md in the same change.

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
