import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';
import { cursorMaintenanceBackendPlugin } from './plugin';

const DEMO_GITLAB_GROUP = 'demo-group';
const DEMO_REPO = `${DEMO_GITLAB_GROUP}/payments-service`;
const DEMO_REPO_URL = `https://gitlab.com/${DEMO_REPO}`;

jest.mock('./maintenanceService', () => {
  const actual = jest.requireActual('./maintenanceService');
  return {
    ...actual,
    runMaintenanceTask: jest.fn(),
  };
});

const { runMaintenanceTask } = jest.requireMock('./maintenanceService') as {
  runMaintenanceTask: jest.Mock;
};

describe('cursor-maintenance backend router', () => {
  beforeEach(() => {
    runMaintenanceTask.mockReset();
    runMaintenanceTask.mockImplementation(async (_request, emit) => {
      emit({ type: 'log', message: 'Working on the task.' });
      emit({
        type: 'complete',
        status: 'finished',
        message: 'Done.',
        prUrl: `https://gitlab.com/${DEMO_REPO}/-/merge_requests/99`,
      });
    });
  });

  it('streams mapped SSE events for a valid request', async () => {
    const backend = await startTestBackend({
      features: [
        mockServices.rootConfig.factory({
          data: {
            cursor: {
              maintenance: {
                apiKey: 'test-api-key',
              },
            },
          },
        }),
        cursorMaintenanceBackendPlugin,
      ],
    });

    const response = await request(backend.server)
      .post('/api/cursor-maintenance/run')
      .send({
        repoUrl: DEMO_REPO_URL,
        task: 'Upgrade dependencies listed in DEPENDENCIES.md',
      })
      .expect(200)
      .expect('Content-Type', /text\/event-stream/);

    expect(response.text).toContain('"type":"log"');
    expect(response.text).toContain('Working on the task.');
    expect(response.text).toContain('"type":"complete"');
    expect(response.text).toContain(
      `https://gitlab.com/${DEMO_REPO}/-/merge_requests/99`,
    );
    expect(runMaintenanceTask).toHaveBeenCalledWith(
      expect.objectContaining({
        repoUrl: DEMO_REPO_URL,
        task: 'Upgrade dependencies listed in DEPENDENCIES.md',
      }),
      expect.any(Function),
      expect.any(Object),
    );
  });

  it('returns 400 for invalid requests', async () => {
    const backend = await startTestBackend({
      features: [
        mockServices.rootConfig.factory({
          data: {
            cursor: {
              maintenance: {
                apiKey: 'test-api-key',
              },
            },
          },
        }),
        cursorMaintenanceBackendPlugin,
      ],
    });

    const response = await request(backend.server)
      .post('/api/cursor-maintenance/run')
      .send({ repoUrl: DEMO_REPO_URL })
      .expect(400);

    expect(response.body.error.message).toContain('task is required');
    expect(runMaintenanceTask).not.toHaveBeenCalled();
  });
});
