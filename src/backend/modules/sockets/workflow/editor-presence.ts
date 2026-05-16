import type { PendingWebhookTestRequest, WorkflowEditorSession } from '@giga/shared/types/contracts/workflow.types';

export type { WorkflowEditorSession } from '@giga/shared/types/contracts/workflow.types';

const editorSessionsByWorkflowId = new Map<string, WorkflowEditorSession>();
const workflowIdBySocketId = new Map<string, string>();
const pendingWebhookRequestsById = new Map<string, PendingWebhookTestRequest>();

export function registerWorkflowEditorSession(params: {
  workflowId: string;
  socketId: string;
  userId: string;
  editable?: boolean;
}): { accepted: true; session: WorkflowEditorSession } | { accepted: false; existing: WorkflowEditorSession } {
  const workflowId = String(params.workflowId || '').trim();
  if (!workflowId) {
    throw new Error('workflowId is required.');
  }

  const existing = editorSessionsByWorkflowId.get(workflowId);
  if (existing && existing.socketId !== params.socketId && existing.editable) {
    return {
      accepted: false,
      existing,
    };
  }

  const previousWorkflowId = workflowIdBySocketId.get(params.socketId);
  if (previousWorkflowId && previousWorkflowId !== workflowId) {
    const previousSession = editorSessionsByWorkflowId.get(previousWorkflowId);
    if (previousSession?.socketId === params.socketId) {
      editorSessionsByWorkflowId.delete(previousWorkflowId);
    }
  }

  const now = new Date().toISOString();
  const session: WorkflowEditorSession = {
    workflowId,
    socketId: params.socketId,
    userId: params.userId,
    editable: params.editable !== false,
    openedAt: existing?.openedAt || now,
    lastSeenAt: now,
  };

  editorSessionsByWorkflowId.set(workflowId, session);
  workflowIdBySocketId.set(params.socketId, workflowId);

  return {
    accepted: true,
    session,
  };
}

export function heartbeatWorkflowEditorSession(params: { workflowId: string; socketId: string; editable?: boolean }): WorkflowEditorSession | null {
  const session = editorSessionsByWorkflowId.get(String(params.workflowId || '').trim());
  if (!session || session.socketId !== params.socketId) {
    return null;
  }

  const nextSession: WorkflowEditorSession = {
    ...session,
    editable: params.editable !== false,
    lastSeenAt: new Date().toISOString(),
  };

  editorSessionsByWorkflowId.set(nextSession.workflowId, nextSession);
  workflowIdBySocketId.set(params.socketId, nextSession.workflowId);
  return nextSession;
}

export function getWorkflowEditorSession(workflowId: string): WorkflowEditorSession | null {
  return editorSessionsByWorkflowId.get(String(workflowId || '').trim()) || null;
}

export function closeWorkflowEditorSession(params: { workflowId: string; socketId: string }): void {
  const workflowId = String(params.workflowId || '').trim();
  const session = editorSessionsByWorkflowId.get(workflowId);
  if (!session || session.socketId !== params.socketId) {
    return;
  }

  editorSessionsByWorkflowId.delete(workflowId);
  workflowIdBySocketId.delete(params.socketId);
}

export function closeWorkflowEditorSessionBySocket(socketId: string): void {
  const workflowId = workflowIdBySocketId.get(socketId);
  if (!workflowId) {
    return;
  }

  const session = editorSessionsByWorkflowId.get(workflowId);
  if (session?.socketId === socketId) {
    editorSessionsByWorkflowId.delete(workflowId);
  }
  workflowIdBySocketId.delete(socketId);
}

export function createPendingWebhookTestRequest(params: { requestId: string; workflowId: string; timeoutMs?: number }): Promise<unknown> {
  const requestId = String(params.requestId || '').trim();
  if (!requestId) {
    throw new Error('requestId is required.');
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      pendingWebhookRequestsById.delete(requestId);
      reject(new Error('Timed out waiting for workflow editor test response.'));
    }, params.timeoutMs ?? 90_000);

    pendingWebhookRequestsById.set(requestId, {
      workflowId: String(params.workflowId || '').trim(),
      resolve,
      reject,
      timeoutId,
    });
  });
}

export function resolvePendingWebhookTestRequest(requestId: string, payload: unknown): void {
  const pending = pendingWebhookRequestsById.get(String(requestId || '').trim());
  if (!pending) {
    return;
  }

  clearTimeout(pending.timeoutId);
  pendingWebhookRequestsById.delete(String(requestId || '').trim());
  pending.resolve(payload);
}

export function rejectPendingWebhookTestRequest(requestId: string, error: Error): void {
  const pending = pendingWebhookRequestsById.get(String(requestId || '').trim());
  if (!pending) {
    return;
  }

  clearTimeout(pending.timeoutId);
  pendingWebhookRequestsById.delete(String(requestId || '').trim());
  pending.reject(error);
}
