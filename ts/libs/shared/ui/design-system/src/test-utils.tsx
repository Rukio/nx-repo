import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, theme } from './lib';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';
import userEvent from '@testing-library/user-event';

type CustomRenderOptions = {
  renderOptions?: Omit<RenderOptions, 'wrapper'>;
  userEventOptions?: UserEventSetupConfig;
};

const WrappedProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  return {
    user: userEvent.setup(options?.userEventOptions),
    ...render(ui, { wrapper: WrappedProviders, ...options?.renderOptions }),
  };
};

export * from '@testing-library/react';
export { customRender as render, userEvent };
