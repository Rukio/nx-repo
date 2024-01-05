import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const customRender = (ui: ReactElement) => {
  return {
    user: userEvent.setup(),
    ...render(ui),
  };
};

export const exactRegexMatch = (value: string) => new RegExp(`^${value}$`);

export { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
export * from '@testing-library/react';
export { customRender as render };
