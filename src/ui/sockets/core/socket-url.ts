export const resolveSocketConfig = (rawUrl: string, fallback: { path: string; url: string }): { path: string; url: string } => {
    try {
        const parsed = new URL(rawUrl);
        const protocol = parsed.protocol === 'wss:' ? 'https:' : parsed.protocol === 'ws:' ? 'http:' : parsed.protocol;
        const url = `${protocol}//${parsed.host}`;
        const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/socket.io';

        return { url, path };
    } catch {
        return fallback;
    }
};
