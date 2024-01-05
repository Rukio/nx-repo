import '@fontsource/open-sans';
import { Preview } from '@storybook/react';
import { theme, ThemeProvider } from '@*company-data-covered*/design-system';

const preview: Preview = {
    decorators: [
      (Story) => (
        <ThemeProvider theme={theme}>
          <Story />
        </ThemeProvider>
      ),
    ],
  };

  export default preview;
