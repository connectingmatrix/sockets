import type { Socket } from 'socket.io';

export const parseTokenFromAuthHeader = (authorization?: string | null) => {
  if (!authorization) return null;
  const raw = authorization.trim();
  if (!raw) return null;
  return raw.replace(/^Bearer\s+/i, '').trim() || null;
};

export const parseAccessTokenPayload = (tokenPayload: string) => {
  if (!tokenPayload) return null;

  if (tokenPayload.includes('=')) {
    const pairs = tokenPayload
      .split(';')
      .map((value) => value.trim())
      .filter(Boolean);
    const map = new Map<string, string>();

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (!key || !value) continue;
      map.set(key.trim(), value.trim());
    }

    return map.get('access_token') || map.get('token') || null;
  }

  return tokenPayload;
};

export const parseTokenFromHandshake = (socket: Socket) => {
  const authToken =
    typeof socket.handshake.auth?.token === 'string' ? parseTokenFromAuthHeader(socket.handshake.auth.token) || socket.handshake.auth.token : null;
  if (authToken) return authToken;

  const headerToken = parseTokenFromAuthHeader(socket.handshake.headers?.authorization as string);
  if (headerToken) return headerToken;

  const queryToken =
    (socket.handshake.query?.token as string) || (socket.handshake.query?.access_token as string) || (socket.handshake.query?.auth_token as string);
  if (!queryToken) return null;

  return parseTokenFromAuthHeader(queryToken) || queryToken;
};
