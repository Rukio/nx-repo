import { FC } from 'react';
import {
  Grid,
  Typography,
  Box,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

interface ProgressBarProps {
  count: number;
  color?: string;
  text?: string;
}

const makeStyles = (color?: string) =>
  makeSxStyles({
    root: {
      display: 'flex',
      gap: 0.5,
      alignItems: 'center',
    },
    container: {
      display: 'flex',
      gap: 0.25,
    },
    item: {
      width: 24,
      height: 12,
      borderRadius: 1,
      backgroundColor: color || 'info.light',
    },
  });

const ProgressBar: FC<ProgressBarProps> = ({ count, color, text }) => {
  const styles = makeStyles(color);

  return (
    <Box sx={styles.root}>
      <Grid sx={styles.container}>
        {Array.from({ length: count }).map((_, index) => (
          <Box key={index} sx={styles.item} />
        ))}
      </Grid>
      {text && (
        <Typography variant="caption" color="text.primary">
          {text}
        </Typography>
      )}
    </Box>
  );
};

export default ProgressBar;
