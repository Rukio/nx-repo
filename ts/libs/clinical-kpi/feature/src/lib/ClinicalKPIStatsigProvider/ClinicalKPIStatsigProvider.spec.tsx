import statsig, { StatsigOptions } from 'statsig-js';
import { waitFor } from '@testing-library/react';
import ClinicalKPIStatsigProvider from './ClinicalKPIStatsigProvider';
import { mockedAuthenticatedUser } from '@*company-data-covered*/clinical-kpi/data-access';
import { render, renderWithUserProvider } from '../util/testUtils';

jest.mock('statsig-js', () => ({
  initialize: jest.fn(
    async () => new Promise((resolve) => setTimeout(resolve, 500))
  ),
}));
const MOCKED_USER = mockedAuthenticatedUser;

const MOCKED_OPTIONS: StatsigOptions = {
  environment: {
    tier: 'development',
  },
};

const FAKE_CLIENT_KEY = 'test';

describe('ClinicalKPIStatsigProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call initialize with correct user id', async () => {
    renderWithUserProvider(
      <ClinicalKPIStatsigProvider
        clientKey={FAKE_CLIENT_KEY}
        options={MOCKED_OPTIONS}
      >
        <div></div>
      </ClinicalKPIStatsigProvider>
    );
    await waitFor(() => {
      expect(statsig.initialize).toHaveBeenCalledWith(
        FAKE_CLIENT_KEY,
        {
          userID: MOCKED_USER.id,
          email: MOCKED_USER.email,
          custom: {
            markets: MOCKED_USER.markets
              ?.map((market) => market.shortName)
              .join('|'),
          },
        },
        MOCKED_OPTIONS
      );
    });
  });

  it('should call initialize without user id', async () => {
    render(
      <ClinicalKPIStatsigProvider
        clientKey={FAKE_CLIENT_KEY}
        options={MOCKED_OPTIONS}
      >
        <div></div>
      </ClinicalKPIStatsigProvider>
    );
    await waitFor(() => {
      expect(statsig.initialize).not.toBeCalled();
    });
  });
});
