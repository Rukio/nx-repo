import { screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { AccessDenied } from '../AccessDenied';

const setup = () => {
  renderWithClient(
    <BrowserRouter>
      <AccessDenied />
    </BrowserRouter>
  );
};

describe('AccessDenied', () => {
  it('renders page', () => {
    setup();
    expect(screen.getByTestId('access-denied-mode')).toBeInTheDocument();
  });
});
