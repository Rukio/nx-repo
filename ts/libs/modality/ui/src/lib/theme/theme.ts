import { theme } from '@*company-data-covered*/design-system';

const customTheme: typeof theme = {
  ...theme,
  components: {
    ...theme.components,
    MuiPaper: {
      ...theme.components?.MuiPaper,
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiCssBaseline: {
      ...theme.components?.MuiCssBaseline,
      styleOverrides: {
        body: {
          minHeight: '100vh',
        },
      },
    },
    MuiSwitch: {
      ...theme.components?.MuiSwitch,
      defaultProps: { color: 'success' },
    },
    MuiTableCell: {
      ...theme.components?.MuiTableCell,
      styleOverrides: {
        root: {
          padding: theme.spacing(0, 2),
          boxShadow: 'inset 0px -1px 0px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
};

export default customTheme;
