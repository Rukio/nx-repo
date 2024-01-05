import { screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { NotFound } from '../NotFound';

const setup = () => {
  renderWithClient(
    <BrowserRouter>
      <NotFound />
    </BrowserRouter>
  );
};

describe('NotFound', () => {
  it('renders page', () => {
    setup();
    expect(screen.getByTestId('page-not-found')).toBeInTheDocument();
  });
});
