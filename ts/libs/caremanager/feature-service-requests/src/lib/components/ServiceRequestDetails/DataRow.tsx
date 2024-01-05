import {
  Grid,
  SxProps,
  Theme,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: {
    padding: '8px 0',
    alignItems: 'center',
  },
  label: {
    width: '150px',
    color: (theme) => theme.palette.text.secondary,
  },
  data: {
    color: (theme) => theme.palette.text.primary,
  },
});

type Props = {
  sx?: SxProps<Theme>;
  label: string;
  testId?: string;
};

export const DataRow: React.FC<React.PropsWithChildren<Props>> = ({
  sx,
  label,
  testId,
  children,
}) => (
  <Grid
    container
    direction="row"
    spacing={1}
    sx={{ ...styles.container, ...sx }}
  >
    <Grid item sx={styles.label}>
      <Typography variant="body2">{label}</Typography>
    </Grid>
    <Grid item xs sx={styles.data} data-testid={testId}>
      {typeof children === 'string' || !children ? (
        <Typography variant="body2">{children ?? '-'}</Typography>
      ) : (
        children
      )}
    </Grid>
  </Grid>
);
