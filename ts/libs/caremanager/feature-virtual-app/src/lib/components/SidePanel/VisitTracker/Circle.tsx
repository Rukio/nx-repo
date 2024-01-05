import {
  Box,
  Grid,
  makeSxStyles,
  StepIconProps,
} from '@*company-data-covered*/design-system';

const makeStyles = (active: boolean) =>
  makeSxStyles({
    container: {
      p: 0.25,
      width: 24,
      height: 24,
    },
    circle: (theme) => ({
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      backgroundColor: active
        ? theme.palette.primary.main
        : theme.palette.text.disabled,
    }),
  });

export const Circle = (props: StepIconProps) => {
  const styles = makeStyles(props.active ?? true);

  return (
    <Grid sx={styles.container}>
      <Box sx={styles.circle} />
    </Grid>
  );
};
