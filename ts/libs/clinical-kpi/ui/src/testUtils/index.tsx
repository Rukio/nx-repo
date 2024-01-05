import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

type CustomRenderOptions = {
  withRouter?: boolean;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
  { withRouter = false }: CustomRenderOptions = {}
) => {
  const component = withRouter ? <BrowserRouter>{ui}</BrowserRouter> : ui;

  return {
    user: userEvent.setup(),
    ...render(component, options),
  };
};

export * from '@testing-library/react';
export { customRender as render, userEvent };
