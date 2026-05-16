# connectingmatrix-sockets folder structure

The repo now uses domain-owned role folders. The package code is no longer parked under migration/transfer labels; it lives where it is owned and executed.

## Canonical layout

```text
connectingmatrix-sockets/
  src/
    index.ts
    package-structure.ts
    ui/
      index.ts
      graphql-client.ts
      dataloaders/
      screens/
      components/
      sockets/
      designer/
    backend/
      index.ts
      modules/
        <capability>/
    entity/
      index.ts
      repository.ts
      entities/
      repositories/
      graphql/
      services/
  migrations/
  tests/
    integration/
```

## Ownership rules

- `ui` contains frontend-facing package clients, dataloaders, screens/components, sockets, and designer launchers.
- `backend` contains server-side non-CRUD package runtime: middleware, GraphQL, APIs, execution services, MCP/status, uploads/webhooks, and package health.
- `entity` contains CRUD/data ownership: entities, repositories, entity GraphQL contracts, tenant scoping, and access-safe persistence.
- `migrations` is flat and package-owned; each package runs its own database scripts.
- `tests` contains independent package tests so the package remains playable outside `giga-ai-backend`.

## Source counts

| Area | Files | Bytes |
|---|---:|---:|
| `ui` | 19 | 35303 |
| `backend` | 25 | 79127 |
| `entity` | 2 | 3281 |
| `migrations` | 1 | 115 |
| `tests` | 5 | 5847 |

## Final naming moves

- `backend`: `socket` → `modules/sockets`
- `ui`: `socket` → `sockets`

The default TypeScript build compiles the package adapter/public API. Full application-source folders are preserved under the role folders and kept out of the adapter build until final external dependency alias conversion is complete.
