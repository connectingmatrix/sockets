import { Socket } from './index.js'; Socket.regester('ROOM'); console.log(await Socket.broadcast('ROOM', { hello: 'world' }));
