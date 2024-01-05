import { screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { MaintenanceMode } from '../MaintenanceMode';

const setup = () => {
  renderWithClient(
    <BrowserRouter>
      <MaintenanceMode />
    </BrowserRouter>
  );
};

describe('MaintenanceMode', () => {
  it('renders page', () => {
    setup();
    expect(screen.getByTestId('maintenance-mode')).toBeInTheDocument();
  });
});
