import { Palette } from '@mui/material';
import { theme, createTheme } from '@*company-data-covered*/design-system';

const requestCareWidgetPalette: Palette = {
  ...theme.palette,
  primary: { ...theme.palette.primary, main: '#0088d8' },
  background: { ...theme.palette.background, default: '#F6F3EA' },
  text: { ...theme.palette.text, primary: '#091325' },
};

const requestCareWidgetTheme = createTheme({
  ...theme,
  breakpoints: {
    values: {
      xs: 0,
      sm: 568,
      md: 768,
      lg: 1280,
      xl: 1440,
    },
  },
  shape: {
    ...theme.shape,
    borderRadius: 8,
  },
  palette: requestCareWidgetPalette,
  typography: {
    ...theme.typography,
    h1: {
      ...theme.typography.h1,
      fontSize: 60,
      lineHeight: '64px',
      fontWeight: 400,
    },
    h2: {
      ...theme.typography.h2,
      fontSize: 50,
      lineHeight: '54px',
      fontWeight: 400,
    },
    h3: {
      ...theme.typography.h3,
      fontSize: 30,
      lineHeight: '34px',
      fontWeight: 400,
    },
    h4: {
      ...theme.typography.h4,
      fontSize: 20,
      lineHeight: '30px',
      fontWeight: 700,
    },
    h5: {
      ...theme.typography.h5,
      fontSize: 14,
      lineHeight: '18px',
      fontWeight: 700,
    },
    h6: {
      ...theme.typography.h6,
      fontSize: 16,
      lineHeight: '18px',
      fontWeight: 700,
    },
    h7: {},
    label: {},
    body1: {
      ...theme.typography.body1,
      fontSize: 18,
      lineHeight: '32px',
      fontWeight: 400,
    },
    body2: {
      ...theme.typography.body2,
      fontSize: 16,
      lineHeight: '24px',
      fontWeight: 400,
    },
  },
  components: {
    ...theme.components,
    MuiInputBase: {
      ...theme.components?.MuiInputBase,
      styleOverrides: {
        root: {
          height: '50px',
          backgroundColor: theme.palette.common.white,
          fontSize: 14,
        },
      },
    },
    MuiSelect: {
      ...theme.components?.MuiSelect,
      styleOverrides: {
        icon: {
          width: '16px',
        },
      },
    },
    MuiMenuItem: {
      ...theme.components?.MuiMenuItem,
      styleOverrides: {
        root: {
          fontSize: 16,
          lineHeight: '24px',
        },
      },
    },
    MuiOutlinedInput: {
      ...theme.components?.MuiOutlinedInput,
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            border: '1px solid #E6E6E6',
          },
        },
        input: {
          padding: '16px',
        },
        notchedOutline: {
          border: '1px solid #E6E6E6',
        },
      },
    },
    MuiTypography: {
      ...theme.components?.MuiTypography,
      styleOverrides: {
        h1: {
          fontFamily: 'Bree Serif',
        },
        h2: {
          fontFamily: 'Bree Serif',
        },
        h3: {
          fontFamily: 'Bree Serif',
        },
      },
    },
    MuiButton: {
      ...theme.components?.MuiButton,
      styleOverrides: {
        root: {
          borderRadius: '10px',
          lineHeight: 1,
          letterSpacing: 'normal',
        },
        sizeSmall: {
          padding: '7px 15px',
          fontSize: 13,
        },
        sizeMedium: {
          padding: '14px 25px',
          fontSize: 16,
        },
        contained: {
          '&:hover': {
            backgroundColor: theme.palette.common.white,
            color: requestCareWidgetPalette.primary.main,
          },
        },
        containedPrimary: {
          border: `1px solid ${requestCareWidgetPalette.primary.main}`,
        },
        outlined: {
          '&:hover': {
            backgroundColor: requestCareWidgetPalette.primary.main,
            color: theme.palette.common.white,
          },
        },
        outlinedPrimary: {
          border: `1px solid ${requestCareWidgetPalette.primary.main}`,
        },
      },
    },
  },
});

export default requestCareWidgetTheme;
