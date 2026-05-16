# Auto-generated API

```json
{
  "package": "@connectingmatrix/sockets",
  "summary": "Frontend/backend room socket architecture with local fallback bus, log emission, runtime rooms, and package status launcher.",
  "contracts": [
    "Socket.register(room)",
    "Socket.regester(room) backward-compatible typo",
    "Socket.broadcast(room, payload, event?, traceId?)",
    "Socket.on(room, handler)",
    "Socket.emitLog(payload)",
    "Socket.bindLogger(Logger)",
    "Socket.bindWithServer(endpoint)",
    "createPackage() middleware/health/launcher"
  ],
  "exports": [
    ".",
    "./backend",
    "./ui",
    "./entity",
    "./package.json",
    "./package-structure",
    "./launcher",
    "./observability"
  ],
  "folderCounts": {
    "src/client": 19,
    "src/backend": 25,
    "src/entity": 2,
    "migrations": 1,
    "tests": 5
  },
  "launcher": "playground.mjs",
  "observability": true
}
```
