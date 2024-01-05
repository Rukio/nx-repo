import { theme } from '@*company-data-covered*/design-system';

const customTheme: typeof theme = {
  ...theme,
  components: {
    ...theme.components,
    MuiButton: {
      ...theme.components?.MuiButton,
      defaultProps: {
        variant: 'contained',
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'initial',
        },
      },
    },
    MuiToggleButtonGroup: {
      ...theme.components?.MuiToggleButtonGroup,
      defaultProps: {
        color: 'primary',
      },
    },
    MuiToggleButton: {
      ...theme.components?.MuiToggleButton,
      styleOverrides: {
        root: {
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
        },
      },
    },
  },
  palette: {
    ...theme.palette,
    background: {
      ...theme.palette.background,
      default: '#FFF',
    },
  },
};

export default customTheme;
