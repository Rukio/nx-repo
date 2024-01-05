import { ThemeProvider } from '@*company-data-covered*/design-system';
import { StatsigProvider } from '@*company-data-covered*/statsig/feature';
import { RequestCareWidget } from '@*company-data-covered*/widgets/request-care/feature';
import { theme } from '@*company-data-covered*/widgets/request-care/ui';
import { createRoot } from 'react-dom/client';
import { StatsigOptions } from 'statsig-js';
import { environment } from '../../environments/environment';

type RequestCareWidgetConfig = {
  elementSelector: string;
};

const statsigOptions: StatsigOptions = {
  environment: {
    tier: environment.statsigTier,
  },
};

export function init(config: RequestCareWidgetConfig) {
  return {
    render: () => {
      const container = document.querySelector(config.elementSelector);
      if (!container) {
        console.warn(
          `[Widgets app] can't find element with the following selector "${config.elementSelector}"`,
          config
        );

        return;
      }
      const root = createRoot(container);
      root.render(
        <ThemeProvider theme={theme}>
          <StatsigProvider
            clientKey={environment.statsigClientKey}
            options={statsigOptions}
          >
            <RequestCareWidget
              webRequestURL={environment.webRequestURL}
              marketingSiteURL={environment.marketingSiteURL}
            />
          </StatsigProvider>
        </ThemeProvider>
      );
    },
  };
}
