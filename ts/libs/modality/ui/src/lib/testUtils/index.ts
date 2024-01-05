import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Config as UserEventSetupConfig } from '@testing-library/user-event/setup/setup';

type CustomRenderOptions = {
  renderOptions?: Omit<RenderOptions, 'queries'>;
  userEventSetupConfig?: Partial<UserEventSetupConfig>;
};

const customRender = (ui: ReactElement, options?: CustomRenderOptions) => {
  return {
    user: userEvent.setup(options?.userEventSetupConfig),
    ...render(ui, options?.renderOptions),
  };
};

export * from '@testing-library/react';
export { customRender as render };
