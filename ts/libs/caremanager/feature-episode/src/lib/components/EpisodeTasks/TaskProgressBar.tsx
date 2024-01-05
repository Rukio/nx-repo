import React from 'react';
import {
  Grid,
  LinearProgress,
  Typography,
  makeSxStyles,
  useMediaQuery,
  useTheme,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  progressBar: { width: '100px', height: '12px', borderRadius: '6px' },
  progressText: { paddingLeft: '12px' },
});

type TaskProgressBarProps = {
  completedTasks: number;
  totalTasks: number;
};

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  completedTasks,
  totalTasks,
}) => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const calculateProgress = () => (completedTasks / totalTasks) * 100;

  const progress = calculateProgress();

  return (
    <Grid container alignItems="center" width={isMobile ? 'auto' : '150px'}>
      {isMobile ? null : (
        <LinearProgress
          data-testid="task-progress-bar"
          variant="determinate"
          value={progress}
          sx={styles.progressBar}
        />
      )}
      <Typography
        variant="body2"
        sx={styles.progressText}
        data-testid="task-progress-bar-label"
      >
        {completedTasks}/{totalTasks}
      </Typography>
    </Grid>
  );
};
export default TaskProgressBar;
