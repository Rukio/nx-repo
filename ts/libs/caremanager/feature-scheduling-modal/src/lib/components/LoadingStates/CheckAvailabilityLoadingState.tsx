import {
  Box,
  CircularProgress,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: (theme) => ({
    background: '#E5F1F1',
    borderRadius: '6px',
    borderLeft: `8px solid ${theme.palette.info.main}`,
    color: theme.palette.warning.contrastText,
    display: 'flex',
    flexDirection: 'row',
    padding: '16px 20px',
  }),
  textContainer: {
    marginLeft: '16px',
  },
});

const CheckAvailabilityLoadingState = () => {
  return (
    <Box sx={styles.container}>
      <CircularProgress color="inherit" size={24} />
      <Box sx={styles.textContainer}>
        <Typography variant="body2">
          Checking schedule availability...
        </Typography>
      </Box>
    </Box>
  );
};

export default CheckAvailabilityLoadingState;
