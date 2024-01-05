import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const customRender = (ui: ReactElement) => {
  return {
    user: userEvent.setup(),
    ...render(ui),
  };
};

export * from '@testing-library/react';
export { customRender as render, userEvent };
