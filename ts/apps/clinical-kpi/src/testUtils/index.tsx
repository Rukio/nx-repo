import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import { StoreProvider } from '@*company-data-covered*/clinical-kpi/feature';

type CustomRenderOptions = {
  options?: Omit<RenderOptions, 'queries'>;
  withRouter?: boolean;
};

const customRender = (
  ui: ReactElement,
  { options, withRouter = false }: CustomRenderOptions = {}
) => {
  const component = withRouter ? <BrowserRouter>{ui}</BrowserRouter> : ui;

  return render(<StoreProvider>{component}</StoreProvider>, options);
};

export * from '@testing-library/react';
export { customRender as render };
