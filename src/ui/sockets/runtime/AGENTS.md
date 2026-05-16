# src/socket/runtime

## Purpose
Runtime socket transport primitives used by dataloaders.

## Rules
- Keep this folder transport-focused and typed.
- Emit/subscribe contracts must stay consistent with runtime event schema.
- Non-blocking error handling and clean unsubscribe behavior are required.

## Runtime event contract
- Incoming frames from `runtime:event` must be treated as raw runtime lifecycle events and forwarded unchanged to dataloader handlers.
- Keep event kinds aligned with backend schema: `agent.run`, `workflow.run`, `swarm.worker`, `process.metric`, `log.line`, `approval.request`, `approval.decision`, `dataset.ingestion`.
- Process state consumers must perform message normalization in dataloaders (`dataloaders/runtime-monitor.loader.ts`), never in sockets.

## Forbidden
- No screen/component imports here.
- No business shaping that belongs in dataloaders.
