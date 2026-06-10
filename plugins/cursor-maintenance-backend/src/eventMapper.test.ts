import {
  mapRunResultToCompleteEvent,
  mapSdkEventToMaintenanceEvent,
} from './eventMapper';
import { validateRunRequest } from './validation';

const DEMO_GITLAB_GROUP = 'demo-group';
const DEMO_REPO = `${DEMO_GITLAB_GROUP}/payments-service`;
const DEMO_REPO_URL = `https://gitlab.com/${DEMO_REPO}`;

describe('validateRunRequest', () => {
  it('accepts repoUrl and task', () => {
    const result = validateRunRequest({
      repoUrl: DEMO_REPO_URL,
      task: 'Upgrade dependencies',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        repoUrl: DEMO_REPO_URL,
        task: 'Upgrade dependencies',
        entityRef: undefined,
      },
    });
  });

  it('accepts entityRef and task', () => {
    const result = validateRunRequest({
      entityRef: 'component:default/payments-service',
      task: 'Migrate logging',
    });

    expect(result).toEqual({
      ok: true,
      value: {
        repoUrl: undefined,
        task: 'Migrate logging',
        entityRef: 'component:default/payments-service',
      },
    });
  });

  it('rejects missing task', () => {
    const result = validateRunRequest({
      repoUrl: DEMO_REPO_URL,
    });

    expect(result).toEqual({
      ok: false,
      error: 'task is required and must be a non-empty string',
    });
  });

  it('rejects when neither repoUrl nor entityRef is provided', () => {
    const result = validateRunRequest({ task: 'Do something' });

    expect(result).toEqual({
      ok: false,
      error: 'Either repoUrl or entityRef is required',
    });
  });
});

describe('mapSdkEventToMaintenanceEvent', () => {
  it('maps assistant text blocks to log events', () => {
    const mapped = mapSdkEventToMaintenanceEvent({
      type: 'assistant',
      agent_id: 'bc-123',
      run_id: 'run-1',
      message: {
        role: 'assistant',
        content: [{ type: 'text', text: 'Updating dependencies.' }],
      },
    });

    expect(mapped).toEqual({
      type: 'log',
      message: 'Updating dependencies.',
      agentId: 'bc-123',
      runId: 'run-1',
    });
  });

  it('maps tool call lifecycle events', () => {
    const started = mapSdkEventToMaintenanceEvent({
      type: 'tool_call',
      agent_id: 'bc-123',
      run_id: 'run-1',
      call_id: 'call-1',
      name: 'edit',
      status: 'running',
    });

    const completed = mapSdkEventToMaintenanceEvent({
      type: 'tool_call',
      agent_id: 'bc-123',
      run_id: 'run-1',
      call_id: 'call-1',
      name: 'edit',
      status: 'completed',
    });

    expect(started).toMatchObject({ type: 'tool_start', toolName: 'edit' });
    expect(completed).toMatchObject({
      type: 'tool_complete',
      toolName: 'edit',
    });
  });

  it('maps run results to complete events with PR URLs', () => {
    const mapped = mapRunResultToCompleteEvent(
      {
        id: 'run-1',
        status: 'finished',
        result: 'Opened pull request.',
        git: {
          branches: [
            {
              repoUrl: DEMO_REPO_URL,
              branch: 'cursor/maintenance',
              prUrl: `https://gitlab.com/${DEMO_REPO}/-/merge_requests/42`,
            },
          ],
        },
      },
      'bc-123',
    );

    expect(mapped).toEqual({
      type: 'complete',
      status: 'finished',
      message: 'Opened pull request.',
      prUrl: `https://gitlab.com/${DEMO_REPO}/-/merge_requests/42`,
      agentId: 'bc-123',
      runId: 'run-1',
    });
  });
});
