import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
  userEventSetupConfig?: UserEventSetupConfig,
  withRouter = false
) => {
  const component = withRouter ? <MemoryRouter>{ui}</MemoryRouter> : ui;

  return {
    user: userEvent.setup(userEventSetupConfig),
    ...render(component, options),
  };
};

export * from '@testing-library/react';
export { customRender as render };
