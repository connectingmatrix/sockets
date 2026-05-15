import test from 'node:test';
import assert from 'node:assert/strict';
import { Socket } from './index.js';

test('broadcasts locally', async () => {
  const seen: unknown[] = [];
  const off = Socket.on('ROOM', (event) => { seen.push(event.payload); });
  await Socket.broadcast('ROOM', { ok: true });
  off();
  assert.deepEqual(seen, [{ ok: true }]);
});
