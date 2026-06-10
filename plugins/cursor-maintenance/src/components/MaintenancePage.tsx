import { useCallback, useMemo, useState } from 'react';
import {
  Content,
  Header,
  HeaderLabel,
  Page,
  Progress,
} from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import BuildIcon from '@material-ui/icons/Build';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useMaintenanceStream } from '../api/maintenanceStream';
import { BacklogCards } from './BacklogCards';
import { LiveLog } from './LiveLog';
import { MAINTENANCE_TASKS, type MaintenanceStreamEvent } from '../types';

const GITLAB_PROJECT_SLUG_ANNOTATION = 'gitlab.com/project-slug';
const JIRA_PROJECT_KEY_ANNOTATION = 'jira.com/project-key';

export const MaintenancePage = () => {
  const { entity } = useEntity();
  const runMaintenance = useMaintenanceStream();
  const [events, setEvents] = useState<MaintenanceStreamEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string>();

  const repoUrl = useMemo(() => {
    const projectSlug =
      entity.metadata.annotations?.[GITLAB_PROJECT_SLUG_ANNOTATION];
    return projectSlug ? `https://gitlab.com/${projectSlug}` : undefined;
  }, [entity.metadata.annotations]);

  const jiraProjectKey = entity.metadata.annotations?.[JIRA_PROJECT_KEY_ANNOTATION];
  const jiraBoardUrl = jiraProjectKey
    ? `https://builders180.atlassian.net/browse/${jiraProjectKey}`
    : undefined;

  const entityRef = stringifyEntityRef(entity);
  const completeEvent = [...events].reverse().find(event => event.type === 'complete');

  const handleRunTask = useCallback(
    async (task: string) => {
      setRunning(true);
      setError(undefined);
      setEvents([]);

      try {
        for await (const event of runMaintenance({
          repoUrl,
          entityRef,
          task,
        })) {
          setEvents(current => [...current, event]);
        }
      } catch (runError) {
        const message =
          runError instanceof Error
            ? runError.message
            : 'Maintenance run failed';
        setError(message);
        setEvents(current => [...current, { type: 'error', message }]);
      } finally {
        setRunning(false);
      }
    },
    [entityRef, repoUrl, runMaintenance],
  );

  return (
    <Page themeId="tool">
      <Header title="Maintenance" subtitle={entity.metadata.name}>
        <HeaderLabel label="Owner" value={String(entity.spec?.owner ?? 'unknown')} />
        <HeaderLabel
          label="Repo"
          value={
            entity.metadata.annotations?.[GITLAB_PROJECT_SLUG_ANNOTATION] ?? 'unknown'
          }
        />
      </Header>
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body1" paragraph>
              Aged backlog items for this service. Launch a Cursor cloud agent to
              apply repo conventions from AGENTS.md and open a pull request.
            </Typography>
            <Box display="flex" flexWrap="wrap" gridGap={8} mb={1}>
              {repoUrl && (
                <Button
                  variant="outlined"
                  color="primary"
                  href={repoUrl}
                  target="_blank"
                  rel="noopener"
                >
                  Open in GitLab
                </Button>
              )}
              {jiraBoardUrl && (
                <Button
                  variant="outlined"
                  href={jiraBoardUrl}
                  target="_blank"
                  rel="noopener"
                >
                  Jira ({jiraProjectKey})
                </Button>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <BacklogCards onSelectTask={handleRunTask} running={running} />
          </Grid>

          <Grid item xs={12} md={8}>
            <Box display="flex" flexWrap="wrap" gridGap={8} mb={2}>
              {MAINTENANCE_TASKS.map(task => (
                <Button
                  key={task.id}
                  variant="contained"
                  color="primary"
                  startIcon={<BuildIcon />}
                  disabled={running}
                  onClick={() => handleRunTask(task.task)}
                >
                  {task.title}
                </Button>
              ))}
            </Box>
            {running && <Progress />}
            {error && (
              <Box mb={2}>
                <Alert severity="error">{error}</Alert>
              </Box>
            )}
            <LiveLog events={events} running={running} />
          </Grid>

          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Result
                </Typography>
                {completeEvent?.prUrl ? (
                  <>
                    <Typography variant="body2" paragraph>
                      {completeEvent.message ?? 'Maintenance run completed.'}
                    </Typography>
                    <Link href={completeEvent.prUrl} target="_blank" rel="noopener">
                      Open pull request
                    </Link>
                  </>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    A PR link appears here when the cloud agent finishes.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
