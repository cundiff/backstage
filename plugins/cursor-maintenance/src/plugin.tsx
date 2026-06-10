import {
  createFrontendPlugin,
  type FrontendPlugin,
} from '@backstage/frontend-plugin-api';
import { EntityContentBlueprint } from '@backstage/plugin-catalog-react/alpha';

const GITLAB_PROJECT_SLUG_ANNOTATION = 'gitlab.com/project-slug';

const maintenanceEntityContent = EntityContentBlueprint.make({
  name: 'maintenance',
  params: {
    path: '/maintenance',
    title: 'Maintenance',
    group: 'maintenance',
    icon: 'build',
    filter: entity =>
      entity.kind === 'Component' &&
      Boolean(entity.metadata.annotations?.[GITLAB_PROJECT_SLUG_ANNOTATION]),
    loader: () =>
      import('./components/MaintenancePage').then(m => <m.MaintenancePage />),
  },
});

const cursorMaintenancePlugin: FrontendPlugin = createFrontendPlugin({
  pluginId: 'cursor-maintenance',
  extensions: [maintenanceEntityContent],
});

export default cursorMaintenancePlugin;
