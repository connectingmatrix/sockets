type SocketLogLevel = 'info' | 'warn' | 'error';

type SocketLogger = {
  info: (event: string, metadata?: Record<string, unknown>) => void;
  warn: (event: string, metadata?: Record<string, unknown>) => void;
  error: (event: string, metadata?: Record<string, unknown>) => void;
};

type SocketEmitter = {
  emit: (event: string, payload: Record<string, unknown>) => boolean;
};

const emitLog = (logger: SocketLogger, level: SocketLogLevel, event: string, metadata: Record<string, unknown>) => {
  setImmediate(() => {
    if (level === 'error') logger.error(event, metadata);
    else if (level === 'warn') logger.warn(event, metadata);
    else logger.info(event, metadata);
  });
};

export const emitSocketEvent = (input: {
  socket: SocketEmitter;
  logger: SocketLogger;
  event: string;
  payload: Record<string, unknown>;
  logEvent: string;
  level?: SocketLogLevel;
  metadata?: Record<string, unknown>;
}): void => {
  try {
    input.socket.emit(input.event, input.payload);
    emitLog(input.logger, input.level || 'info', input.logEvent, { event: input.event, ...(input.metadata || {}) });
  } catch (error) {
    emitLog(input.logger, 'error', `${input.logEvent}.failed`, {
      event: input.event,
      error: error instanceof Error ? error.message : String(error || 'socket emit failed'),
      ...(input.metadata || {}),
    });
  }
};
