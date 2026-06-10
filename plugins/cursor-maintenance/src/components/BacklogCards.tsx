import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { MAINTENANCE_TASKS } from '../types';

type BacklogCardsProps = {
  onSelectTask: (task: string) => void;
  running: boolean;
};

export const BacklogCards = ({ onSelectTask, running }: BacklogCardsProps) => {
  return (
    <Grid container spacing={2}>
      {MAINTENANCE_TASKS.map(item => (
        <Grid item xs={12} md={6} key={item.id}>
          <Card variant="outlined">
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="h6">{item.title}</Typography>
                <Chip size="small" label={`${item.ageDays}d old`} />
              </Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                {item.description}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip size="small" color="secondary" label={item.priority} />
                <Chip
                  clickable
                  color="primary"
                  label="Run with Cursor"
                  onClick={() => onSelectTask(item.task)}
                  disabled={running}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
