import { createTheme, lighten } from '@mui/material/styles';
import { darken } from '@mui/system';
import colorManipulator from '../styles/colorManipulator';
import createDHPalette from './palette';
import createDHTypography from './typography';

// if this import is changed to be from @mui/system instead, it will not include several vital theme variables
// that the MUI v5 docs claim are included in the default theme (https://next--material-ui.netlify.app/customization/default-theme/)
// some of which are palette, shadows, zIndex, etc.
// this can be seen in their source code (https://github.com/mui-org/material-ui/blob/next/packages/mui-system/src/createTheme/createTheme.js)
// TODO: determine if this theme override is still necessary
declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Theme {}
  // allow configuration using `createTheme`
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface ThemeOptions {}
}

declare module '@mui/material/Button' {
  export interface ButtonPropsSizeOverrides {
    extraLarge: true;
  }
}

const paletteOptions = createDHPalette();
const paletteTheme = createTheme({ palette: paletteOptions });

const theme = createTheme({
  palette: createDHPalette(),
  typography: createDHTypography(),
  components: {
    MuiAlert: {
      styleOverrides: {
        standard: {
          borderLeft: '8px solid',
          paddingLeft: 12,
          color: paletteTheme.palette.text.primary,
          '& .MuiAlert-icon': {
            color: paletteTheme.palette.text.primary,
          },
        },
        outlined: {
          border: 'none',
          paddingLeft: 0,
          paddingRight: 0,
          backgroundColor: 'white',
          color: paletteTheme.palette.text.primary,
        },
        filled: {},
      },
      variants: [
        {
          props: { severity: 'error', variant: 'standard' },
          style: {
            backgroundColor: lighten(paletteTheme.palette.error.main, 0.9),
            borderColor: paletteTheme.palette.error.main,
          },
        },
        {
          props: { severity: 'warning', variant: 'standard' },
          style: {
            backgroundColor: lighten(paletteTheme.palette.warning.main, 0.9),
            borderColor: paletteTheme.palette.warning.main,
          },
        },
        {
          props: { severity: 'info', variant: 'standard' },
          style: {
            backgroundColor: lighten(paletteTheme.palette.info.main, 0.9),
            borderColor: paletteTheme.palette.info.main,
          },
        },
        {
          props: { severity: 'success', variant: 'standard' },
          style: {
            backgroundColor: lighten(paletteTheme.palette.success.main, 0.9),
            borderColor: paletteTheme.palette.success.main,
          },
        },
        {
          props: { severity: 'error', variant: 'outlined' },
          style: {
            '& .MuiAlert-icon': {
              color: paletteTheme.palette.error.main,
            },
          },
        },
        {
          props: { severity: 'warning', variant: 'outlined' },
          style: {
            '& .MuiAlert-icon': {
              color: paletteTheme.palette.warning.main,
            },
          },
        },
        {
          props: { severity: 'info', variant: 'outlined' },
          style: {
            '& .MuiAlert-icon': {
              color: paletteTheme.palette.info.main,
            },
          },
        },
        {
          props: { severity: 'success', variant: 'outlined' },
          style: {
            '& .MuiAlert-icon': {
              color: paletteTheme.palette.success.main,
            },
          },
        },
        {
          props: { severity: 'error', variant: 'filled' },
          style: {
            backgroundColor: paletteTheme.palette.error.dark,
          },
        },
        {
          props: { severity: 'warning', variant: 'filled' },
          style: {
            color: paletteTheme.palette.warning.contrastText,
            '& .MuiAlert-icon': {
              color: darken(paletteTheme.palette.warning.main, 0.4),
            },
          },
        },
      ],
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'F5F5F5',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      variants: [
        {
          props: { size: 'extraLarge' },
          style: {
            padding: '10px 28px',
            fontSize: '1rem',
          },
        },
      ],
    },
    MuiButtonGroup: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiToggleButtonGroup: {
      variants: [
        {
          props: { color: 'primary' },
          style: {
            '& .MuiToggleButton-root': {
              borderColor: paletteTheme.palette.primary.main,
              color: paletteTheme.palette.primary.main,
              '&.Mui-selected': {
                backgroundColor: paletteTheme.palette.primary.main,
                color: paletteTheme.palette.common.white,
                '&:hover': {
                  backgroundColor: colorManipulator.darken(
                    paletteTheme.palette.primary.main,
                    0.05
                  ),
                },
              },
            },
          },
        },
        {
          props: { color: 'secondary' },
          style: {
            '& .MuiToggleButton-root': {
              borderColor: paletteTheme.palette.secondary.dark,
              color: paletteTheme.palette.secondary.dark,
              '&.Mui-selected': {
                backgroundColor: paletteTheme.palette.secondary.dark,
                color: paletteTheme.palette.common.white,
                '&:hover': {
                  backgroundColor: colorManipulator.darken(
                    paletteTheme.palette.secondary.dark,
                    0.05
                  ),
                },
              },
            },
          },
        },
        {
          props: { color: 'error' },
          style: {
            '& .MuiToggleButton-root': {
              borderColor: paletteTheme.palette.error.dark,
              color: paletteTheme.palette.error.dark,
              '&.Mui-selected': {
                backgroundColor: paletteTheme.palette.error.dark,
                color: paletteTheme.palette.common.white,
                '&:hover': {
                  backgroundColor: colorManipulator.darken(
                    paletteTheme.palette.error.dark,
                    0.05
                  ),
                },
              },
            },
          },
        },
        {
          props: { color: 'warning' },
          style: {
            '& .MuiToggleButton-root': {
              borderColor: paletteTheme.palette.warning.main,
              color: paletteTheme.palette.warning.main,
              '&.Mui-selected': {
                backgroundColor: paletteTheme.palette.warning.main,
                color: paletteTheme.palette.text.primary,
                '&:hover': {
                  backgroundColor: colorManipulator.darken(
                    paletteTheme.palette.warning.main,
                    0.05
                  ),
                },
              },
            },
          },
        },
        {
          props: { color: 'info' },
          style: {
            '& .MuiToggleButton-root': {
              borderColor: paletteTheme.palette.info.main,
              color: paletteTheme.palette.info.main,
              '&.Mui-selected': {
                backgroundColor: paletteTheme.palette.info.main,
                color: paletteTheme.palette.common.white,
                '&:hover': {
                  backgroundColor: colorManipulator.darken(
                    paletteTheme.palette.info.main,
                    0.05
                  ),
                  color: paletteTheme.palette.common.white,
                },
              },
            },
          },
        },
        {
          props: { color: 'success' },
          style: {
            '& .MuiToggleButton-root': {
              borderColor: paletteTheme.palette.success.main,
              color: paletteTheme.palette.success.main,
              '&.Mui-selected': {
                backgroundColor: paletteTheme.palette.success.main,
                color: paletteTheme.palette.common.white,
                '&:hover': {
                  backgroundColor: colorManipulator.darken(
                    paletteTheme.palette.success.main,
                    0.05
                  ),
                  color: paletteTheme.palette.common.white,
                },
              },
            },
          },
        },
      ],
    },
  },
  shape: {
    borderRadius: 6,
  },
});

export default theme;
export { type Theme } from '@mui/material/styles/createTheme';
