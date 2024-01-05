import { FC, PropsWithChildren, ReactElement } from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';
import { StoreProvider as WebRequestStoreProvider } from '@*company-data-covered*/consumer-web/web-request/feature';
import { StoreProvider as OnlineSelfSchedulingStoreProvider } from '@*company-data-covered*/consumer-web/online-self-scheduling/feature';

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
  }: CustomRenderOptions = {},
  StoreProviderComponent?: FC<PropsWithChildren>
) => {
  const component = withRouter ? (
    <MemoryRouter {...routerProps}>{ui}</MemoryRouter>
  ) : (
    ui
  );

  const user = userEvent.setup(userEventSetupConfig);

  if (StoreProviderComponent) {
    return {
      user,
      ...render(
        <StoreProviderComponent>{component}</StoreProviderComponent>,
        options
      ),
    };
  }

  return {
    user: userEvent.setup(userEventSetupConfig),
    ...render(component, options),
  };
};

const webRequestRender = (
  ui: ReactElement,
  customRenderOptions: CustomRenderOptions = {}
) => {
  return customRender(ui, customRenderOptions, WebRequestStoreProvider);
};

const onlineSelfSchedulingRender = (
  ui: ReactElement,
  customRenderOptions: CustomRenderOptions = {}
) => {
  return customRender(
    ui,
    customRenderOptions,
    OnlineSelfSchedulingStoreProvider
  );
};

export * from '@testing-library/react';
export { customRender as render, webRequestRender, onlineSelfSchedulingRender };
