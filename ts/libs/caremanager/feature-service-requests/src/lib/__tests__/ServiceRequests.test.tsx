import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { updateMockedGates } from '@*company-data-covered*/caremanager/utils-mocks';
import * as DesignSystem from '@*company-data-covered*/design-system';
import { ServiceRequests } from '../ServiceRequests';

vi.spyOn(DesignSystem, 'useMediaQuery').mockReturnValue(false);

const setup = (path = '/', featureFlagResponse = true) => {
  updateMockedGates('care_manager_service_requests', featureFlagResponse);

  return renderWithClient(
    <MemoryRouter initialEntries={[path]}>
      <ServiceRequests />
    </MemoryRouter>
  );
};

describe('ServiceRequests', () => {
  afterEach(() => vi.resetAllMocks());

  it('should render the review queue section', async () => {
    setup();
    expect(
      await screen.findByTestId('review-queue-section')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('archive-section')).not.toBeInTheDocument();
  });

  it('should render the archive section', async () => {
    setup('/archive');
    expect(await screen.findByTestId('archive-section')).toBeInTheDocument();
    expect(
      screen.queryByTestId('review-queue-section')
    ).not.toBeInTheDocument();
  });

  it('should show page not found when feature flag is off', async () => {
    setup('/requests', false);
    expect(await screen.findByTestId('page-not-found')).toBeInTheDocument();
  });
});
