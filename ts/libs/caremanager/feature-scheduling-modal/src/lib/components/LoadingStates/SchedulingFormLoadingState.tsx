import {
  Box,
  CircularProgress,
  Stack,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  circularProgressContainer: (theme) => ({
    color: theme.palette.text.secondary,
  }),
  stack: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  text: (theme) => ({
    color: theme.palette.text.secondary,
  }),
});

const SchedulingFormLoadingState = () => {
  return (
    <Stack spacing={2} sx={styles.stack}>
      <Box sx={styles.circularProgressContainer}>
        <CircularProgress color="inherit" size={40} />
      </Box>
      <Typography sx={styles.text} variant="body1">
        Loading Scheduling Information...
      </Typography>
    </Stack>
  );
};

export default SchedulingFormLoadingState;
