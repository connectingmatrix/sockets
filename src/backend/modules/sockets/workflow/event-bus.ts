import { Executor } from '@workflow/executor';
import type { WorkflowRunLogEvent } from '@connectingmatrix/workflows/services/workflow/contracts/types';

export const getWorkflowUserRoom = (userId: string) => Executor.userRoom(userId);
export const getWorkflowRunRoom = (userId: string, runId: string) => Executor.logsRoom(userId, runId);
export const getWorkflowBroadcastRoom = (broadcastId: string, channelName: string) => Executor.catalogRoom(broadcastId, channelName);
export const getWorkflowExecutionRoom = (broadcastId: string, workflowId: string) => Executor.workflowRoom(broadcastId, workflowId);

export const emitWorkflowLogEvent = (params: { broadcastId: string; broadcastChannelName: string; workflowId: string; event: WorkflowRunLogEvent }) =>
  Executor.publish(getWorkflowExecutionRoom(params.broadcastId, params.workflowId), 'workflow:event', params.event);

export const emitWorkflowCatalogStatus = (params: {
  broadcastId: string;
  broadcastChannelName: string;
  workflowId: string;
  isRunning: boolean;
  activeExecutionCount: number;
  queuedExecutionCount?: number;
  latestCompletedAt?: string | null;
  latestRunAt?: string | null;
  latestStatus?: string | null;
}) =>
  Executor.publish(getWorkflowBroadcastRoom(params.broadcastId, params.broadcastChannelName), 'workflow:catalog:status', {
    workflowId: params.workflowId,
    isRunning: params.isRunning,
    activeExecutionCount: params.activeExecutionCount,
    queuedExecutionCount: params.queuedExecutionCount || 0,
    latestCompletedAt: params.latestCompletedAt || null,
    latestRunAt: params.latestRunAt || null,
    latestStatus: params.latestStatus || null,
  });

export const emitWorkflowExecutionUpdate = (params: { broadcastId: string; broadcastChannelName: string; execution: Record<string, unknown> }) =>
  Executor.publish(getWorkflowBroadcastRoom(params.broadcastId, params.broadcastChannelName), 'workflow:execution:update', params.execution);
