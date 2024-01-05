import { TypographyOptions } from '@mui/material/styles/createTypography';

// Loading fonts via NPM for performance https://fontsource.org/docs/introduction and minimize extra install steps for consuming design system
// Unclear how this impacts bundle size
import '@fontsource/open-sans/300.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';

declare module '@mui/material/styles/createTypography' {
  export interface TypographyOptions {
    h7: {
      [k: string]: unknown | CSSProperties;
    };
    label: {
      [k: string]: unknown | CSSProperties;
    };
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    h7: true;
    label: true;
  }
}

export default function createDHTypography(): TypographyOptions {
  return {
    fontFamily: ['Open Sans', 'Segoe UI', 'Tahoma', 'sans-serif'].join(','),
    htmlFontSize: 16,
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h1: {
      fontWeight: 300,
      fontSize: '3.375rem',
      lineHeight: 1.185,
    },
    h2: {
      fontWeight: 300,
      fontSize: '2.625rem',
      lineHeight: 1.19,
    },
    h3: {
      fontWeight: 400,
      fontSize: '2rem',
      lineHeight: 1.25,
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.75rem',
      lineHeight: 1.25,
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.375,
      letterSpacing: '0.01rem',
    },
    h7: {
      fontWeight: 700,
      fontSize: '0.875rem',
      lineHeight: 1.285,
      letterSpacing: '0.016rem',
    },
    subtitle1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.01rem',
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.428,
      letterSpacing: '0.016rem',
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.031rem',
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.016rem',
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.714,
      textTransform: 'none',
      letterSpacing: '0.025rem',
    },
    label: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.33,
      letterSpacing: '0.025rem',
    },
    caption: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.33,
      letterSpacing: '0.025rem',
    },
    overline: {
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.5,
      textTransform: 'uppercase',
      letterSpacing: '0.094rem',
    },
  };
}

export { typography } from '@mui/system';
