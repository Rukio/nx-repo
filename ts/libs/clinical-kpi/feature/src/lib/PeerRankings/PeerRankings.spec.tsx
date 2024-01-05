import { screen, waitFor, within } from '@testing-library/react';
import {
  mockedAuthenticatedUser,
  selectSelectedMarketId,
  sortMarketsAlphabetically,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import PeerRankings, {
  ALERT_ERROR_TEXT,
  ALERT_NO_INFO_TEXT,
  buildAlertMessage,
} from './PeerRankings';
import {
  mockedUserWithOneMarket,
  mockedUserWithoutMarkets,
} from './testUtils/mocks';
import { interceptQuery, renderWithUserProvider } from '../util/testUtils';
import {
  MARKET_METRICS_INTERCEPT_URL,
  USER_INTERCEPT_URL,
} from '../util/testUtils/server/handlers';

describe('<PeerRankings  />', () => {
  it('should render correctly properly with multiple markets', async () => {
    const { user } = renderWithUserProvider(<PeerRankings />);

    const marketsDropdown = await screen.findByTestId(
      TEST_IDS.MARKETS_DROPDOWN.SELECT
    );
    const selectedElement = within(marketsDropdown).getByRole('button');
    expect(selectedElement).toBeVisible();

    await user.click(selectedElement);

    mockedAuthenticatedUser.markets.forEach((market) => {
      expect(
        screen.getByTestId(TEST_IDS.MARKETS_DROPDOWN.SELECT_ITEM(market.id))
      ).toBeVisible();
    });
  });

  it('should select the first sorted available market when user unassigned from old market', async () => {
    const oldMarketId = '211';
    const { store } = renderWithUserProvider(<PeerRankings />, {
      preloadedState: {
        peerRankings: {
          selectedMarketId: oldMarketId,
        },
      },
    });
    const { selectedMarketId: selectOldMarketId } = selectSelectedMarketId(
      store.getState()
    );
    expect(selectOldMarketId).toEqual(oldMarketId);

    await waitFor(() => {
      const { selectedMarketId: selectActualMarketId } = selectSelectedMarketId(
        store.getState()
      );
      expect(selectActualMarketId).toEqual(
        sortMarketsAlphabetically(mockedAuthenticatedUser.markets)[0].id
      );
    });
  });

  it('should render correctly properly with one market', async () => {
    interceptQuery({
      url: USER_INTERCEPT_URL,
      data: { user: mockedUserWithOneMarket },
    });

    renderWithUserProvider(<PeerRankings />);

    expect(
      screen.queryByTestId(TEST_IDS.MARKETS_DROPDOWN.SELECT)
    ).not.toBeInTheDocument();
  });

  it('should render correctly properly without markets', async () => {
    interceptQuery({
      url: USER_INTERCEPT_URL,
      data: { user: mockedUserWithoutMarkets },
    });

    renderWithUserProvider(<PeerRankings />);

    expect(
      screen.queryByTestId(TEST_IDS.MARKETS_DROPDOWN.SELECT)
    ).not.toBeInTheDocument();
  });

  describe('Peer Rankings Alerts', () => {
    describe('should render alert when metrics are empty', () => {
      beforeEach(() => {
        interceptQuery({
          url: MARKET_METRICS_INTERCEPT_URL,
          data: { providerMetrics: [] },
        });
      });

      it('when metrics are empty for a user with multiple markets', async () => {
        renderWithUserProvider(<PeerRankings />);
        const expectedAlertMessage = `No metrics found for the ${
          sortMarketsAlphabetically(mockedAuthenticatedUser.markets)[0].name
        }. Please try another market.`;
        const noInfoAlert = await screen.findByText(expectedAlertMessage);
        expect(noInfoAlert).toBeVisible();
      });

      it('when metrics are empty for a user with one market', async () => {
        interceptQuery({
          url: USER_INTERCEPT_URL,
          data: { user: mockedUserWithOneMarket },
        });
        renderWithUserProvider(<PeerRankings />);
        const expectedAlertMessage = `No metrics found for the ${mockedUserWithOneMarket.markets[0].name}`;
        const noInfoAlert = await screen.findByText(expectedAlertMessage);
        expect(noInfoAlert).toBeVisible();
      });

      it('when metrics are empty for a user without markets', async () => {
        interceptQuery({
          url: USER_INTERCEPT_URL,
          data: { user: mockedUserWithoutMarkets },
        });
        renderWithUserProvider(<PeerRankings />);
        const noInfoAlert = await screen.findByText(ALERT_NO_INFO_TEXT);
        expect(noInfoAlert).toBeVisible();
      });
    });

    it('should render ALERT_ERROR_TEXT when there is an error', async () => {
      interceptQuery({
        url: MARKET_METRICS_INTERCEPT_URL,
        statusCode: 500,
      });
      renderWithUserProvider(<PeerRankings />);

      const errorAlert = await screen.findByText(ALERT_ERROR_TEXT);
      expect(errorAlert).toBeVisible();
    });
  });

  describe('Unit tests', () => {
    describe('buildAlertMessage()', () => {
      it('should return ALERT_NO_INFO_TEXT if market is not found', () => {
        const alertMessage = buildAlertMessage(
          mockedUserWithoutMarkets.markets,
          undefined
        );
        expect(alertMessage).toEqual(ALERT_NO_INFO_TEXT);
      });

      it('should return message when user is assigned only to one market', () => {
        const alertMessage = buildAlertMessage(
          [...mockedUserWithOneMarket.markets],
          mockedUserWithOneMarket.markets[0].id
        );
        expect(alertMessage).toEqual(
          `No metrics found for the ${mockedUserWithOneMarket.markets[0].name}`
        );
      });

      it('should return message when user is assigned to multiple markets', () => {
        const alertMessage = buildAlertMessage(
          [...mockedAuthenticatedUser.markets],
          mockedAuthenticatedUser.markets[0].id
        );
        expect(alertMessage).toEqual(
          `No metrics found for the ${mockedAuthenticatedUser.markets[0].name}. Please try another market.`
        );
      });
    });
  });
});
