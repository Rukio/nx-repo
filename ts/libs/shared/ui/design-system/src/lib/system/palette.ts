import { PaletteOptions } from '@mui/material';
import { alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    outlineBorder: string;
    backdropOverlay: string;
    filledInputBackground: string;
    standardInputLine: string;
    snackbar: string;
    ratingActive: string;
  }

  interface PaletteOptions {
    outlineBorder: string;
    backdropOverlay: string;
    filledInputBackground: string;
    standardInputLine: string;
    snackbar: string;
    ratingActive: string;
  }

  interface PaletteColor {
    hover: string;
    selected: string;
    focus: string;
    enabled: string;
    background: string;
  }

  interface SimplePaletteColorOptions {
    hover: string;
    selected: string;
    focus: string;
    enabled: string;
    background: string;
  }

  interface TypeText {
    contrast: string;
    hover: string;
    selected: string;
    focus: string;
  }
}

const textPrimary = '#1E2930';
const primaryMain = '#0074B8';
const secondaryMain = '#978AB5';
const errorMain = '#D52C00';
const successMain = '#0A810B';
const warningMain = '#EBAC17';
const infoMain = '#007C79';
const white = '#FFFFFF';
const backgroundPaper = '#FEFEFE';
const textContrast = '#121212';

export default function createDHPaletteOptions(): PaletteOptions {
  return {
    mode: 'light',
    text: {
      primary: textPrimary,
      secondary: '#5E696F',
      disabled: '#9AA3A9',
      contrast: textContrast,
      hover: alpha(textPrimary, 0.04),
      selected: alpha(textPrimary, 0.12),
      focus: alpha(textPrimary, 0.3),
    },
    primary: {
      main: primaryMain,
      light: '#58C1FF',
      dark: '#0067A4',
      contrastText: white,
      hover: alpha(primaryMain, 0.04),
      selected: alpha(primaryMain, 0.08),
      focus: alpha(primaryMain, 0.3),
      enabled: alpha(primaryMain, 0.5),
      background: alpha(primaryMain, 0.1),
    },
    secondary: {
      main: secondaryMain,
      light: '#E2DDEE',
      dark: '#73639B',
      contrastText: white,
      hover: alpha(secondaryMain, 0.04),
      selected: alpha(secondaryMain, 0.08),
      focus: alpha(secondaryMain, 0.3),
      enabled: alpha(secondaryMain, 0.5),
      background: alpha(secondaryMain, 0.1),
    },
    common: {
      black: '#1D1D1D',
      white: white,
    },
    error: {
      main: errorMain,
      light: '#FF9E84',
      dark: '#BE2800',
      contrastText: white,
      hover: alpha(errorMain, 0.04),
      selected: alpha(errorMain, 0.08),
      focus: alpha(errorMain, 0.3),
      enabled: alpha(errorMain, 0.5),
      background: alpha(errorMain, 0.1),
    },
    success: {
      main: successMain,
      light: '#6AE79C',
      dark: '#1AA251',
      contrastText: '#fff',
      hover: alpha(successMain, 0.04),
      selected: alpha(successMain, 0.08),
      focus: alpha(successMain, 0.3),
      enabled: alpha(successMain, 0.5),
      background: '#E5F2F2',
    },
    warning: {
      main: warningMain,
      light: '#FFEAB9',
      dark: '#8F690C',
      contrastText: textContrast,
      hover: alpha(warningMain, 0.04),
      selected: alpha(warningMain, 0.08),
      focus: alpha(warningMain, 0.3),
      enabled: alpha(warningMain, 0.5),
      background: alpha(warningMain, 0.1),
    },
    info: {
      main: infoMain,
      light: '#00CCC7',
      dark: '#006F6C',
      contrastText: white,
      hover: alpha(infoMain, 0.04),
      selected: alpha(infoMain, 0.08),
      focus: alpha(infoMain, 0.3),
      enabled: alpha(infoMain, 0.5),
      background: '#E5F2F2',
    },
    contrastThreshold: 3,
    tonalOffset: 0.2,
    background: {
      paper: backgroundPaper,
      default: '#F9F9F9',
    },
    action: {
      active: 'rgba(17, 27, 34, 0.54)',
      hover: 'rgba(17, 27, 34, 0.04)',
      hoverOpacity: 0.04,
      selected: 'rgba(17, 27, 34, 0.08)',
      selectedOpacity: 0.08,
      disabled: 'rgba(17, 27, 34, 0.26)',
      disabledBackground: 'rgba(17, 27, 34, 0.12)',
      disabledOpacity: 0.26,
      focus: 'rgba(17, 27, 34, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.12,
    },
    divider: '#EFF4F7',
    grey: {
      50: '#FAFBFC',
      100: '#EFF4F7',
      200: '#DDE7EE',
      300: '#C5D6E2',
      400: '#90B1C8',
      500: '#4D7B9A',
      600: '#3A5C74',
      700: '#3A5C74',
      800: '#294152',
      900: '#17232D',
      A100: '#EFF4F7',
      A200: '#DDE7EE',
      A400: '#90B1C8',
      A700: '#3A5C74',
    },
    outlineBorder: '#DDE7EE',
    backdropOverlay: alpha(textContrast, 0.5),
    filledInputBackground: alpha(backgroundPaper, 0.06),
    standardInputLine: alpha(textContrast, 0.42),
    snackbar: '#294152',
    ratingActive: '#EBAC17',
  };
}
