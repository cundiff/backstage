import { useEffect, useRef } from 'react';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import type { MaintenanceStreamEvent } from '../types';

type LiveLogProps = {
  events: MaintenanceStreamEvent[];
  running: boolean;
};

const eventLabel = (event: MaintenanceStreamEvent) => {
  switch (event.type) {
    case 'tool_start':
      return `[tool] ${event.toolName ?? 'tool'} started`;
    case 'tool_complete':
      return `[tool] ${event.toolName ?? 'tool'} completed`;
    case 'status':
      return `[status] ${event.message ?? event.status ?? 'update'}`;
    case 'complete':
      return `[complete] ${event.message ?? 'Run finished'}`;
    case 'error':
      return `[error] ${event.message ?? 'Run failed'}`;
    default:
      return event.message ?? '';
  }
};

export const LiveLog = ({ events, running }: LiveLogProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [events]);

  return (
    <Paper variant="outlined">
      <Box p={2} borderBottom="1px solid" borderColor="divider">
        <Typography variant="h6">Live agent log</Typography>
        <Typography variant="body2" color="textSecondary">
          {running ? 'Streaming events from Cursor cloud agent…' : 'Idle'}
        </Typography>
      </Box>
      <Box
        p={2}
        height={280}
        overflow="auto"
        bgcolor="grey.50"
        fontFamily="monospace"
        fontSize={13}
      >
        <div ref={containerRef} style={{ height: '100%', overflow: 'auto' }}>
        {events.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            Run a maintenance task to stream agent output here.
          </Typography>
        ) : (
          events.map((event, index) => (
            <Box key={`${event.type}-${index}`} mb={1}>
              {eventLabel(event)}
            </Box>
          ))
        )}
        </div>
      </Box>
    </Paper>
  );
};
