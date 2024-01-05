import { format } from 'date-fns';
import { screen } from '@testing-library/react';
import {
  AuthenticatedUser,
  mockedAuthenticatedUser,
  mockedProviderMetrics,
  ProviderMetrics,
  ProfilePosition,
} from '@*company-data-covered*/clinical-kpi/data-access';
import {
  interceptQuery,
  renderWithUserProvider,
  within,
} from '../util/testUtils';
import Header from './Header';
import React from 'react';
import {
  PROVIDER_METRICS_INTERCEPT_URL,
  USER_INTERCEPT_URL,
} from '../util/testUtils/server/handlers';
import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';

jest.mock('statsig-js', () => ({
  checkGate: jest.fn(),
}));

const STATION_URL_QA = 'https://qa.*company-data-covered*.com/';

describe('Header', () => {
  const mockedNow = new Date(2020, 3, 1, 8);
  const expectedDateFormat = 'MMMM d, yyyy';

  beforeEach(() => {
    jest.setSystemTime(mockedNow);
  });

  it.each<{
    description: string;
    mockProviderMetrics: ProviderMetrics;
    mockUser: AuthenticatedUser;
    expectedLastUpdatedAt: string;
  }>([
    {
      description: 'should render the data correctly with updated at',
      mockProviderMetrics: {
        ...mockedProviderMetrics,
        updatedAt: '2023-03-16T12:00:00.000Z',
        createdAt: '2023-03-15T12:00:00.000Z',
      },
      mockUser: mockedAuthenticatedUser,
      expectedLastUpdatedAt: '2023-03-16T12:00:00.000Z',
    },
    {
      description: 'should render the data correctly with created at',
      mockProviderMetrics: {
        ...mockedProviderMetrics,
        updatedAt: undefined,
        createdAt: '2023-03-15T12:00:00.000Z',
      },
      mockUser: mockedAuthenticatedUser,
      expectedLastUpdatedAt: '2023-03-15T12:00:00.000Z',
    },
    {
      description:
        'should render the data correctly with no last updated value',
      mockProviderMetrics: {
        ...mockedProviderMetrics,
        updatedAt: undefined,
        createdAt: '',
      },
      mockUser: mockedAuthenticatedUser,
      expectedLastUpdatedAt: mockedNow.toISOString(),
    },
  ])(
    '$description',
    async ({ mockProviderMetrics, mockUser, expectedLastUpdatedAt }) => {
      interceptQuery({
        url: PROVIDER_METRICS_INTERCEPT_URL,
        data: { metrics: mockProviderMetrics },
      });
      interceptQuery({
        url: USER_INTERCEPT_URL,
        data: { user: mockUser },
      });

      renderWithUserProvider(<Header stationURL={STATION_URL_QA} />);
      const greetingText = await screen.findByText(
        `Good Morning, ${mockUser.firstName}`
      );
      expect(greetingText).toBeVisible();

      const lastUpdated = await screen.findByText(
        `Last Updated: ${format(
          new Date(expectedLastUpdatedAt),
          expectedDateFormat
        )}`
      );
      expect(lastUpdated).toBeVisible();

      const visitsCompleted = await screen.findByText(
        `Visits Completed Last Week: ${mockProviderMetrics.careRequestsCompletedLastSevenDays}`
      );

      expect(visitsCompleted).toBeVisible();
    }
  );

  it('should change selected Position on handle Position change', async () => {
    const { user } = renderWithUserProvider(
      <Header stationURL={STATION_URL_QA} isLeadersView />
    );

    const dropdownSelect = within(
      await screen.findByTestId(TEST_IDS.POSITION_DROPDOWN.SELECT)
    ).getByRole('button');
    await user.click(dropdownSelect);
    const dhmtPosition = await screen.findByTestId(
      TEST_IDS.POSITION_DROPDOWN.getSelectItem(ProfilePosition.Dhmt)
    );
    await user.click(dhmtPosition);
    expect(dropdownSelect).toHaveTextContent(ProfilePosition.Dhmt);
  });

  it('should change selected Market on handle Market change', async () => {
    const { user } = renderWithUserProvider(
      <Header stationURL={STATION_URL_QA} isLeadersView />
    );

    const dropdownSelect = within(
      await screen.findByTestId(TEST_IDS.MARKETS_DROPDOWN.SELECT)
    ).getByRole('button');
    await user.click(dropdownSelect);

    const secondMarket = mockedAuthenticatedUser.markets[1];
    const market = await screen.findByTestId(
      TEST_IDS.MARKETS_DROPDOWN.SELECT_ITEM(secondMarket.id)
    );
    await user.click(market);
    expect(dropdownSelect).toHaveTextContent(secondMarket.name);
  });
});
