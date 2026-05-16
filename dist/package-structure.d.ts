export declare const PACKAGE_STRUCTURE: {
    readonly package: "connectingmatrix-sockets";
    readonly structuredAt: "2026-05-15";
    readonly layout: "package-owned-ui-backend-entity";
    readonly principle: "The package owns its UI contract, backend runtime contract, entity/CRUD contract, GraphQL extension, migrations, tests, and status surface. giga-ai-backend and giga-ai-ui remain thin composition shells.";
    readonly entrypoints: {
        readonly root: "src/index.ts";
        readonly ui: "src/ui/index.ts";
        readonly backend: "src/backend/index.ts";
        readonly entity: "src/entity/index.ts";
        readonly structure: "src/package-structure.ts";
    };
    readonly folders: {
        readonly "src/ui": "browser/UI contract: dataloaders, bindWithServer clients, screens, components, socket clients, and designer entry points";
        readonly "src/backend": "server contract: package middleware, GraphQL schema/resolvers, backend services, runtime modules, webhooks/uploads/MCP APIs, and health/status";
        readonly "src/backend/modules": "domain runtime modules owned by this package, grouped by capability instead of legacy app paths";
        readonly "src/entity": "data contract: entities, repositories, access-scoped CRUD, and entity GraphQL support";
        readonly "src/entity/entities": "entity classes and persistent record definitions";
        readonly "src/entity/repositories": "CRUD repositories and persistence adapters";
        readonly "src/entity/graphql": "entity-owned GraphQL contracts/resolvers/schema helpers";
        readonly migrations: "package-owned database migrations";
        readonly tests: "unit and integration tests for the package API and compatibility behavior";
    };
    readonly movesApplied: {
        readonly backend: readonly [readonly ["socket", "modules/sockets"]];
        readonly ui: readonly [readonly ["socket", "sockets"]];
        readonly entity: readonly [];
    };
    readonly counts: {
        readonly ui: {
            readonly files: 19;
            readonly bytes: 35303;
        };
        readonly backend: {
            readonly files: 25;
            readonly bytes: 79127;
        };
        readonly entity: {
            readonly files: 2;
            readonly bytes: 3281;
        };
        readonly migrations: {
            readonly files: 1;
            readonly bytes: 115;
        };
        readonly tests: {
            readonly files: 5;
            readonly bytes: 5847;
        };
    };
};
export default PACKAGE_STRUCTURE;
