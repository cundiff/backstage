import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

export const cursorMaintenanceBackendPlugin = createBackendPlugin({
  pluginId: 'cursor-maintenance',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init({ config, logger, httpRouter, discovery, auth }) {
        httpRouter.use(
          await createRouter({ config, logger, discovery, auth }),
        );
      },
    });
  },
});
