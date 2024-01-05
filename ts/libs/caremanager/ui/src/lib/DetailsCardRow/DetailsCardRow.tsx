import { Divider, Grid, makeSxStyles } from '@*company-data-covered*/design-system';

type Props = {
  label: string;
  appendDivider?: boolean;
  testId?: string;
};

const styles = makeSxStyles({
  container: {
    marginBottom: 2,
    fontSize: 14,
    '&:last-child': { marginBottom: 0 },
  },
  divider: { marginBottom: 2 },
});

export const DetailsCardRow: React.FC<React.PropsWithChildren<Props>> = ({
  label,
  appendDivider,
  children,
  testId,
}) => (
  <>
    <Grid container direction="row" spacing={1} sx={styles.container}>
      <Grid item xs color={(theme) => theme.palette.text.secondary}>
        {label}
      </Grid>
      <Grid
        item
        xs
        color={(theme) => theme.palette.text.primary}
        data-testid={testId}
      >
        {children || '-'}
      </Grid>
    </Grid>
    {appendDivider && <Divider sx={styles.divider}></Divider>}
  </>
);
