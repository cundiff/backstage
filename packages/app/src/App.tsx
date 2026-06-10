import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import jiraPlugin from '@axis-backstage/plugin-jira-dashboard/alpha';
import cursorMaintenancePlugin from '@internal/plugin-cursor-maintenance';
import { navModule } from './modules/nav';

export default createApp({
  features: [catalogPlugin, navModule, jiraPlugin, cursorMaintenancePlugin],
});
