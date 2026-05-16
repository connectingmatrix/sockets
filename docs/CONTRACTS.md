# @connectingmatrix/sockets

Frontend/backend room socket architecture with local fallback bus, log emission, runtime rooms, and package status launcher.

## Ownership

This package owns its `src/client`, `src/backend`, `src/entity`, GraphQL bundle, migrations, health/status, launcher, and package contracts. It can be included in backend or UI without assuming a monorepo.

## Public contracts

- `Socket.register(room)`
- `Socket.regester(room) backward-compatible typo`
- `Socket.broadcast(room, payload, event?, traceId?)`
- `Socket.on(room, handler)`
- `Socket.emitLog(payload)`
- `Socket.bindLogger(Logger)`
- `Socket.bindWithServer(endpoint)`
- `createPackage() middleware/health/launcher`


## Basic usage

```ts
import { Socket } from '@connectingmatrix/sockets';
Socket.regester('ROOM');
Socket.on('ROOM', (event) => console.log(event.payload));
await Socket.broadcast('ROOM', { ok: true });
```

## Server usage

```ts
import { createPackage } from '@connectingmatrix/sockets';
const pkg = createPackage();
await pkg.health?.();
// register pkg.routes as middleware and merge pkg.graphql into /graphql
```

## UI usage

Package UI modules expose `bindWithServer('/graphql')` where applicable. Domain packages own their dataloaders; the thin UI only renders/binds.

## Observability and process monitor

All packages expose `PackageObservability`. The server wires logger and sockets into every package. Logger registers package health probes and exposes `/logger/process-monitor` plus `/server/process-monitor`.

## Launcher

Run locally:

```bash
npm run build
node playground.mjs
```

The launcher opens in stub mode so the package can be tested independently, similar to workflow designer stub mode.

## GraphQL and routes

GraphQL namespace and routes are returned by `createPackage()`. Routes include health and launcher endpoints when needed.

## Exports

- `.`
- `./backend`
- `./ui`
- `./entity`
- `./package.json`
- `./package-structure`
- `./launcher`
- `./observability`

## Folder counts

- `src/client`: 19 files
- `src/backend`: 25 files
- `src/entity`: 2 files
- `migrations`: 1 files
- `tests`: 5 files

