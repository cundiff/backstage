import {
  discoveryApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import type { MaintenanceStreamEvent, RunMaintenanceRequest } from '../types';

function parseSseChunk(chunk: string): MaintenanceStreamEvent | null {
  const dataLine = chunk
    .split('\n')
    .find(line => line.startsWith('data: '));

  if (!dataLine) {
    return null;
  }

  return JSON.parse(dataLine.slice(6)) as MaintenanceStreamEvent;
}

export async function* streamMaintenanceRun(
  baseUrl: string,
  token: string | undefined,
  body: RunMaintenanceRequest,
): AsyncGenerator<MaintenanceStreamEvent> {
  const response = await fetch(`${baseUrl}/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => undefined);
    const message =
      errorBody?.error?.message ??
      errorBody?.error ??
      `Maintenance request failed (${response.status})`;
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Maintenance response did not include a stream body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const event = parseSseChunk(chunk);
      if (event) {
        yield event;
      }
    }
  }

  if (buffer.trim()) {
    const event = parseSseChunk(buffer);
    if (event) {
      yield event;
    }
  }
}

export function useMaintenanceStream() {
  const discoveryApi = useApi(discoveryApiRef);
  const identityApi = useApi(identityApiRef);

  return async function* runMaintenance(
    body: RunMaintenanceRequest,
  ): AsyncGenerator<MaintenanceStreamEvent> {
    const baseUrl = await discoveryApi.getBaseUrl('cursor-maintenance');
    const { token } = await identityApi.getCredentials();
    yield* streamMaintenanceRun(baseUrl, token, body);
  };
}
