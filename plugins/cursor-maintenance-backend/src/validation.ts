import type { RunMaintenanceRequest } from './types';

export type ValidationResult =
  | { ok: true; value: RunMaintenanceRequest }
  | { ok: false; error: string };

export function validateRunRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const record = body as Record<string, unknown>;
  const { repoUrl, task, entityRef } = record;

  if (typeof task !== 'string' || task.trim().length === 0) {
    return { ok: false, error: 'task is required and must be a non-empty string' };
  }

  if (repoUrl !== undefined && typeof repoUrl !== 'string') {
    return { ok: false, error: 'repoUrl must be a string when provided' };
  }

  if (entityRef !== undefined && typeof entityRef !== 'string') {
    return { ok: false, error: 'entityRef must be a string when provided' };
  }

  if (!repoUrl && !entityRef) {
    return {
      ok: false,
      error: 'Either repoUrl or entityRef is required',
    };
  }

  return {
    ok: true,
    value: {
      repoUrl: typeof repoUrl === 'string' ? repoUrl : undefined,
      task: task.trim(),
      entityRef: typeof entityRef === 'string' ? entityRef : undefined,
    },
  };
}
