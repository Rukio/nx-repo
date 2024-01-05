import { screen, waitFor } from '@testing-library/react';
import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import UserMarketsValidator from './UserMarketsValidator';
import { interceptQuery, renderWithUserProvider } from '../util/testUtils';
import { USER_INTERCEPT_URL } from '../util/testUtils/server/handlers';
import { mockedAuthenticatedUser } from '@*company-data-covered*/clinical-kpi/data-access';

describe('UserMarketsValidator', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('API returns an authenticated user with markets', async () => {
    renderWithUserProvider(
      <UserMarketsValidator stationURL="/">
        <p>Test Children</p>
      </UserMarketsValidator>
    );
    const childElement = await screen.findAllByText('Test Children');
    expect(childElement).toBeTruthy();

    const errorElement = screen.queryByTestId(TEST_IDS.ALERT_BUTTON.TEXT);
    expect(errorElement).toBeFalsy();
  });

  it('API returns an authenticated user without markets', async () => {
    interceptQuery({
      url: USER_INTERCEPT_URL,
      data: { user: { ...mockedAuthenticatedUser, markets: [] } },
    });
    renderWithUserProvider(
      <UserMarketsValidator stationURL="/">
        <p>Test Children</p>
      </UserMarketsValidator>
    );
    const childElement = screen.queryByText('Test Children');
    expect(childElement).toBeFalsy();
    await waitFor(() => {
      expect(
        screen.getByTestId(TEST_IDS.ALERT_BUTTON.TEXT).textContent
      ).toBeTruthy();
    });
  });
});
