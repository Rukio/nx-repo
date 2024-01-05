import { ReactElement } from 'react';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';

type CustomRenderOptions = {
  renderOptions?: Omit<RenderOptions, 'queries'>;
  userEventOptions?: UserEventSetupConfig;
  withRouter?: boolean;
  routerProps?: MemoryRouterProps;
};

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  const component = options?.withRouter ? (
    <MemoryRouter {...options.routerProps}>{ui}</MemoryRouter>
  ) : (
    ui
  );

  return {
    user: userEvent.setup(options?.userEventOptions),
    ...render(component, options?.renderOptions),
  };
};

export * from '@testing-library/react';
export { customRender as render, userEvent };
