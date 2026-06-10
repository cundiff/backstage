export type MaintenanceStreamEventType =
  | 'log'
  | 'tool_start'
  | 'tool_complete'
  | 'status'
  | 'complete'
  | 'error';

export type MaintenanceStreamEvent = {
  type: MaintenanceStreamEventType;
  message?: string;
  toolName?: string;
  status?: string;
  prUrl?: string;
  agentId?: string;
  runId?: string;
};

export type RunMaintenanceRequest = {
  repoUrl?: string;
  task: string;
  entityRef?: string;
};
