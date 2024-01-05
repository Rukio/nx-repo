import { Theme } from '@mui/material/styles/createTheme';
import { Components } from '@mui/material/styles/components';

export default function getOverrides(theme: Theme): Components {
  return {
    MuiFilledInput: {
      defaultProps: {
        disableUnderline: true,
      },
      styleOverrides: {
        root: {
          backgroundColor: 'white',
          fontSize: '1rem',
        },
        input: {
          border: '1px solid rgba(0, 0, 0, 0.23)',
          borderRadius: 4,
          padding: theme.spacing(2, 1.5),
          '&:before, &:after': {
            display: 'none',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: 'contained',
      },
      styleOverrides: {
        contained: {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.common.white,
        },
        root: {
          textTransform: 'capitalize', // changes child text string of a Button
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'filled',
      },
    },
  };
}
