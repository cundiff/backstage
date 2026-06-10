import express from 'express';
import Router from 'express-promise-router';
import type {
  AuthService,
  DiscoveryService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { runMaintenanceTask, writeSseEvent } from './maintenanceService';
import { validateRunRequest } from './validation';

export interface RouterOptions {
  config: RootConfigService;
  logger: LoggerService;
  discovery: DiscoveryService;
  auth: AuthService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.post('/run', async (req, res) => {
    const validation = validateRunRequest(req.body);
    if (!validation.ok) {
      throw new InputError(validation.error);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const write = (chunk: string) => {
      res.write(chunk);
    };

    try {
      await runMaintenanceTask(
        validation.value,
        event => writeSseEvent(write, event),
        options,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Maintenance run failed';
      options.logger.error(`Maintenance run failed: ${message}`);
      writeSseEvent(write, { type: 'error', message });
    } finally {
      res.end();
    }
  });

  return router;
}
