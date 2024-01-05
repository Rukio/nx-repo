import { Meta } from '@storybook/react';
import { Grid, Link, NotesIcon, theme, Typography } from '..';

const styles = {
  container: {
    m: `${theme.spacing(5)} auto`,
  },
};

export const Intro = () => (
  <Grid
    container
    item
    spacing={0}
    direction="column"
    sx={styles.container}
    xs={7}
  >
    <Grid container direction="column" spacing={6} item>
      <Grid container item alignItems="center" spacing={3}>
        <Grid item>
          <Typography variant="h4">*company-data-covered* Design System</Typography>
        </Grid>
      </Grid>

      <Grid container item direction="column" spacing={3}>
        <Grid container item alignItems="center" spacing={2}>
          <Grid item>
            <NotesIcon />
          </Grid>
          <Grid item>
            <Typography variant="h5">Documentation & Examples</Typography>
          </Grid>
        </Grid>
        <Grid item>
          <Typography>
            The main source for Dispatch Health&apos;s design principles, rules,
            implementation instructions, and examples can be viewed on{' '}
            <Link
              href="https://zeroheight.com/6d1cb36c5"
              target="_blank"
              rel="noreferrer"
            >
              ZeroHeight
            </Link>{' '}
            and the corresponding visual design components can be found in{' '}
            <Link
              href="https://www.figma.com/file/MSWEDJjUGA2CbY9mf0tRov/*company-data-covered*---MUI---WIP?node-id=4662%3A14"
              target="_blank"
              rel="noreferrer"
            >
              Figma
            </Link>
            .
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  </Grid>
);

export default {
  title: 'Intro',
} as Meta<typeof Intro>;
