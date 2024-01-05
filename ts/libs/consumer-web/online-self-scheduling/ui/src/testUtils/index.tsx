import { ReactElement } from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';

type CustomRenderOptions = {
  options?: Omit<RenderOptions, 'queries'>;
  userEventSetupConfig?: UserEventSetupConfig;
  withRouter?: boolean;
  routerProps?: MemoryRouterProps;
};

const customRender = (
  ui: ReactElement,
  {
    options,
    userEventSetupConfig,
    withRouter = false,
    routerProps = {},
  }: CustomRenderOptions = {}
) => {
  const component = withRouter ? (
    <MemoryRouter {...routerProps}>{ui}</MemoryRouter>
  ) : (
    ui
  );

  return {
    user: userEvent.setup(userEventSetupConfig),
    ...render(component, options),
  };
};

export const exactRegexMatch = (value: string) => new RegExp(`^${value}$`);

export * from '@testing-library/react';
export { customRender as render };
