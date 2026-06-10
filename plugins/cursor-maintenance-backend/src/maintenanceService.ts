import { Agent } from '@cursor/sdk';
import type { Config } from '@backstage/config';
import type {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import {
  formatSseEvent,
  mapRunResultToCompleteEvent,
  mapSdkEventToMaintenanceEvent,
} from './eventMapper';
import { resolveRepoUrl } from './repoResolver';
import type { MaintenanceStreamEvent, RunMaintenanceRequest } from './types';

export type AgentFactory = typeof Agent.create;

export type MaintenanceServiceOptions = {
  config: Config;
  logger: LoggerService;
  discovery: DiscoveryService;
  auth: AuthService;
  createAgent?: AgentFactory;
};

export async function runMaintenanceTask(
  request: RunMaintenanceRequest,
  emit: (event: MaintenanceStreamEvent) => void,
  options: MaintenanceServiceOptions,
): Promise<void> {
  const apiKey = options.config.getOptionalString('cursor.maintenance.apiKey');

  if (!apiKey) {
    throw new Error('cursor.maintenance.apiKey is not configured');
  }

  const repoUrl = await resolveRepoUrl({
    repoUrl: request.repoUrl,
    entityRef: request.entityRef,
    discovery: options.discovery,
    auth: options.auth,
  });

  const createAgent = options.createAgent ?? Agent.create.bind(Agent);
  const prompt = `${request.task}. Follow this repo's AGENTS.md if present. Open a PR when done.`;

  options.logger.info(
    `Starting maintenance agent for ${repoUrl}: ${request.task}`,
  );

  await using agent = await createAgent({
    apiKey,
    model: { id: 'composer-2.5' },
    cloud: {
      repos: [{ url: repoUrl, startingRef: 'main' }],
      autoCreatePR: true,
      skipReviewerRequest: true,
    },
  });

  emit({
    type: 'status',
    status: 'STARTING',
    message: `Agent ${agent.agentId} started for ${repoUrl}`,
    agentId: agent.agentId,
  });

  const run = await agent.send(prompt);

  for await (const event of run.stream()) {
    const mapped = mapSdkEventToMaintenanceEvent(event);
    if (mapped) {
      emit(mapped);
    }
  }

  const result = await run.wait();
  emit(mapRunResultToCompleteEvent(result, agent.agentId));
}

export function writeSseEvent(
  write: (chunk: string) => void,
  event: MaintenanceStreamEvent,
): void {
  write(formatSseEvent(event));
}
