import { fireEvent, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { updateMockedGates } from '@*company-data-covered*/caremanager/utils-mocks';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import UserNavigation from '../UserNavigation';

describe('UserNavigation component', () => {
  const setup = (
    props: {
      isMobile: boolean;
    },
    featureFlagResponse = true
  ) => {
    updateMockedGates('care_manager_service_requests', featureFlagResponse);

    return renderWithClient(
      <Router>
        <UserNavigation {...props} />
      </Router>
    );
  };

  it('renders correctly on desktop view', () => {
    setup({ isMobile: false });
    expect(screen.getByTestId('settings-button')).toBeInTheDocument();
    expect(
      screen.queryByTestId('hamburger-menu-button')
    ).not.toBeInTheDocument();
  });

  it('renders correctly on mobile view', () => {
    setup({ isMobile: true });
    expect(screen.queryByTestId('settings-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('hamburger-menu-button')).toBeInTheDocument();
  });

  it('should show the link to requests when feature flag is on', async () => {
    setup({ isMobile: true }, true);
    fireEvent.click(screen.getByTestId('hamburger-menu-button'));
    expect(await screen.findByTestId('link-to-requests')).toBeInTheDocument();
  });

  it('should not show the link to requests when feature flag is off', async () => {
    setup({ isMobile: true }, false);
    fireEvent.click(screen.getByTestId('hamburger-menu-button'));
    expect(screen.queryByTestId('link-to-requests')).not.toBeInTheDocument();
  });

  describe('correctly closes the drawer', () => {
    const linkTestIds = [
      'close-drawer-button',
      'link-to-episodes',
      'link-to-settings',
      'link-to-requests',
    ];
    linkTestIds.forEach((dataTestId) => {
      it(`after clicking on ${dataTestId}`, async () => {
        setup({ isMobile: true });
        expect(screen.queryByTestId(dataTestId)).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId('hamburger-menu-button'));
        expect(screen.getByTestId(dataTestId)).toBeInTheDocument();
        fireEvent.click(screen.getByTestId(dataTestId));
        await waitFor(() => {
          expect(screen.queryByTestId(dataTestId)).not.toBeInTheDocument();
        });
      });
    });
  });
});
