import { ReactElement } from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';
import { StoreProvider } from '@*company-data-covered*/insurance/feature';

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
    ...render(<StoreProvider>{component}</StoreProvider>, options),
  };
};

export * from '@testing-library/react';
export { customRender as render };
