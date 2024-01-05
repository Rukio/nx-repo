import { updateMockedGates } from '@*company-data-covered*/caremanager/utils-mocks';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

const setup = (featureFlagResponse = true) => {
  updateMockedGates('care_manager_service_requests', featureFlagResponse);
  updateMockedGates('virtual_app_caremanager', featureFlagResponse);

  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
};

describe('Header', () => {
  afterEach(() => vi.resetAllMocks());

  it('should render correctly', () => {
    setup();
    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('episodes-router-button')).toBeInTheDocument();
    expect(screen.getByTestId('requests-router-button')).toBeInTheDocument();
    expect(screen.getByTestId('virtual-app-router-button')).toBeInTheDocument();
    expect(screen.getByTestId('settings-button')).toBeInTheDocument();
  });

  it('should not show the requests button when feature flag is off', () => {
    setup(false);

    expect(
      screen.queryByTestId('requests-router-button')
    ).not.toBeInTheDocument();
  });

  it('should not show the virtual app button when feature flag is off', () => {
    setup(false);

    expect(
      screen.queryByTestId('virtual-app-router-button')
    ).not.toBeInTheDocument();
  });
});
