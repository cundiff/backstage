export type MaintenanceStreamEvent = {
  type: 'log' | 'tool_start' | 'tool_complete' | 'status' | 'complete' | 'error';
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

export const MAINTENANCE_TASKS = [
  {
    id: 'upgrade-deps',
    title: 'Upgrade deps',
    description: 'Review DEPENDENCIES.md and bump outdated packages safely.',
    task: 'Upgrade dependencies listed in DEPENDENCIES.md',
    ageDays: 47,
    priority: 'Medium',
  },
  {
    id: 'migrate-logging',
    title: 'Migrate logging',
    description: 'Replace console.log usage with structured logging.',
    task: 'Migrate console.log calls in src/index.ts to structured logging',
    ageDays: 92,
    priority: 'High',
  },
  {
    id: 'fix-docker-port',
    title: 'Fix docker port conflict',
    description:
      'Update .cursor/skills/start-local-nopcommerce/SKILL.md port fallback when 8080 is taken (NOP-7).',
    task:
      'Update .cursor/skills/start-local-nopcommerce/SKILL.md to add a port fallback when 8080 is already in use',
    ageDays: 14,
    priority: 'High',
  },
] as const;
