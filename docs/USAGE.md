# Usage for @connectingmatrix/sockets

```ts
import { Socket } from '@connectingmatrix/sockets';
Socket.regester('ROOM');
Socket.on('ROOM', (event) => console.log(event.payload));
await Socket.broadcast('ROOM', { ok: true });
```

See `../README.md` for the full contract list.
