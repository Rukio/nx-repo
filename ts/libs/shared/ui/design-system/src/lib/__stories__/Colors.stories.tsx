import { Meta } from '@storybook/react';
import { Box, Grid, theme, Typography } from '..';

const styles = {
  container: {
    m: `${theme.spacing(5)} auto`,
  },
};

interface ColorBoxProps {
  bgcolor: string;
  text: string;
  path: string;
}

const ColorBox = ({ bgcolor, text, path }: ColorBoxProps) => (
  <Grid item>
    <Box
      sx={{ width: 50, height: 50, border: '1px solid black' }}
      bgcolor={bgcolor}
    />
    <Typography>{text}</Typography>
    <Typography>{bgcolor}</Typography>
    <Typography>{path}</Typography>
  </Grid>
);

export const Colors = () => (
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
          <Typography variant="h1">Colors</Typography>
        </Grid>
      </Grid>

      <Grid container item direction="column" spacing={3}>
        <Grid item>
          <Typography variant="h2">Palette</Typography>
        </Grid>
        <Grid container item>
          <Grid item>
            <Typography variant="h3">Text</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.text.disabled}
              path="theme.palette.text.disabled"
              text="Disabled"
            />
            <ColorBox
              bgcolor={theme.palette.text.primary}
              path="theme.palette.text.primary"
              text="Primary"
            />
            <ColorBox
              bgcolor={theme.palette.text.secondary}
              path="theme.palette.text.secondary"
              text="Secondary"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Primary</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.primary.main}
              path="theme.palette.primary.main"
              text="Main"
            />
            <ColorBox
              bgcolor={theme.palette.primary.light}
              path="theme.palette.primary.light"
              text="Light"
            />
            <ColorBox
              bgcolor={theme.palette.primary.dark}
              path="theme.palette.primary.dark"
              text="Dark"
            />
            <ColorBox
              bgcolor={theme.palette.primary.contrastText}
              path="theme.palette.primary.contrastText"
              text="Contrast Text"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Secondary</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.secondary.main}
              path="theme.palette.secondary.main"
              text="Main"
            />
            <ColorBox
              bgcolor={theme.palette.secondary.light}
              path="theme.palette.secondary.light"
              text="Light"
            />
            <ColorBox
              bgcolor={theme.palette.secondary.dark}
              path="theme.palette.secondary.dark"
              text="Dark"
            />
            <ColorBox
              bgcolor={theme.palette.secondary.contrastText}
              path="theme.palette.secondary.contrastText"
              text="Contrast Text"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Success</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.success.main}
              path="theme.palette.success.main"
              text="Main"
            />
            <ColorBox
              bgcolor={theme.palette.success.light}
              path="theme.palette.success.light"
              text="Light"
            />
            <ColorBox
              bgcolor={theme.palette.success.dark}
              path="theme.palette.success.dark"
              text="Dark"
            />
            <ColorBox
              bgcolor={theme.palette.success.contrastText}
              path="theme.palette.success.contrastText"
              text="Contrast Text"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Warning</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.warning.main}
              path="theme.palette.warning.main"
              text="Main"
            />
            <ColorBox
              bgcolor={theme.palette.warning.light}
              path="theme.palette.warning.light"
              text="Light"
            />
            <ColorBox
              bgcolor={theme.palette.warning.dark}
              path="theme.palette.warning.dark"
              text="Dark"
            />
            <ColorBox
              bgcolor={theme.palette.warning.contrastText}
              path="theme.palette.warning.contrastText"
              text="Contrast Text"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Info</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.info.main}
              path="theme.palette.info.main"
              text="Main"
            />
            <ColorBox
              bgcolor={theme.palette.info.light}
              path="theme.palette.info.light"
              text="Light"
            />
            <ColorBox
              bgcolor={theme.palette.info.dark}
              path="theme.palette.info.dark"
              text="Dark"
            />
            <ColorBox
              bgcolor={theme.palette.info.contrastText}
              path="theme.palette.info.contrastText"
              text="Contrast Text"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Error</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.error.main}
              path="theme.palette.error.main"
              text="Main"
            />
            <ColorBox
              bgcolor={theme.palette.error.light}
              path="theme.palette.error.light"
              text="Light"
            />
            <ColorBox
              bgcolor={theme.palette.error.dark}
              path="theme.palette.error.dark"
              text="Dark"
            />
            <ColorBox
              bgcolor={theme.palette.error.contrastText}
              path="theme.palette.error.contrastText"
              text="Contrast Text"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Common</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.common.black}
              path="theme.palette.common.black"
              text="Black"
            />
            <ColorBox
              bgcolor={theme.palette.common.white}
              path="theme.palette.common.white"
              text="White"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Background</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.background.paper}
              path="theme.palette.background.paper"
              text="Paper"
            />
            <ColorBox
              bgcolor={theme.palette.background.default}
              path="theme.palette.background.default"
              text="Default"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Action</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.action.active}
              path="theme.palette.action.active"
              text="Active"
            />
            <ColorBox
              bgcolor={theme.palette.action.hover}
              path="theme.palette.action.hover"
              text="Hover"
            />
            <ColorBox
              bgcolor={theme.palette.action.selected}
              path="theme.palette.action.selected"
              text="Selected"
            />
            <ColorBox
              bgcolor={theme.palette.action.disabled}
              path="theme.palette.action.disabled"
              text="Disabled"
            />
            <ColorBox
              bgcolor={theme.palette.action.disabledBackground}
              path="theme.palette.action.disabledBackground"
              text="Disabled background"
            />
            <ColorBox
              bgcolor={theme.palette.action.focus}
              path="theme.palette.action.focus"
              text="Focus"
            />
          </Grid>
        </Grid>

        <Grid container item>
          <Grid item>
            <Typography variant="h3">Grey</Typography>
          </Grid>
          <Grid container spacing={4}>
            <ColorBox
              bgcolor={theme.palette.grey[50]}
              path="theme.palette.grey[50]"
              text="50"
            />
            <ColorBox
              bgcolor={theme.palette.grey[100]}
              path="theme.palette.grey[100]"
              text="100"
            />
            <ColorBox
              bgcolor={theme.palette.grey[200]}
              path="theme.palette.grey[200]"
              text="200"
            />
            <ColorBox
              bgcolor={theme.palette.grey[300]}
              path="theme.palette.grey[300]"
              text="300"
            />
            <ColorBox
              bgcolor={theme.palette.grey[400]}
              path="theme.palette.grey[400]"
              text="400"
            />
            <ColorBox
              bgcolor={theme.palette.grey[500]}
              path="theme.palette.grey[500]"
              text="500"
            />
            <ColorBox
              bgcolor={theme.palette.grey[600]}
              path="theme.palette.grey[600]"
              text="600"
            />
            <ColorBox
              bgcolor={theme.palette.grey[700]}
              path="theme.palette.grey[700]"
              text="700"
            />
            <ColorBox
              bgcolor={theme.palette.grey[800]}
              path="theme.palette.grey[800]"
              text="800"
            />
            <ColorBox
              bgcolor={theme.palette.grey[900]}
              path="theme.palette.grey[900]"
              text="900"
            />
            <ColorBox
              bgcolor={theme.palette.grey.A100}
              path="theme.palette.grey.A100"
              text="A100"
            />
            <ColorBox
              bgcolor={theme.palette.grey.A200}
              path="theme.palette.grey.A200"
              text="A200"
            />
            <ColorBox
              bgcolor={theme.palette.grey.A400}
              path="theme.palette.grey.A400"
              text="A400"
            />
            <ColorBox
              bgcolor={theme.palette.grey.A700}
              path="theme.palette.grey.A700"
              text="A700"
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  </Grid>
);

export default {
  title: 'Colors',
} as Meta<typeof Colors>;
