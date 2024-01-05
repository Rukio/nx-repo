import { render, screen, waitFor, within } from '../testUtils';
import {
  NETWORKS_TABLE_TEST_IDS,
  NETWORKS_FILTERS_TEST_IDS,
} from '@*company-data-covered*/modality/ui';
import NetworksConfiguration from './NetworksConfiguration';
import {
  mockedMarket as domainMockedMarket,
  selectInsuranceNetworks,
} from '@*company-data-covered*/station/data-access';
import {
  transformDomainMarket,
  RootState,
  selectMarkets,
  NETWORKS_CONFIGURATION_KEY,
  initialNetworksConfigurationState,
  selectNetworksConfigurationSearchParams,
  transformNetworksSearchParamsToDomain,
} from '@*company-data-covered*/modality/data-access';

const mockedMarket = transformDomainMarket(domainMockedMarket);

const getNetworksMarketSelect = () =>
  within(screen.getByTestId(NETWORKS_FILTERS_TEST_IDS.MARKET_SELECT)).getByRole(
    'button'
  );
const queryNoSearchResultsText = () =>
  screen.queryByTestId(NETWORKS_TABLE_TEST_IDS.TABLE_NO_RESULTS_TEXT);
const getNetworksTable = () =>
  screen.getByTestId(NETWORKS_TABLE_TEST_IDS.TABLE_ROOT);
const getNetworksTableRow = (networkId: string | number) =>
  screen.getByTestId(NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(networkId));
const queryNetworksTableRow = (networkId: string | number) =>
  screen.queryByTestId(NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(networkId));
const getTableNextPageButton = () =>
  within(getNetworksTable()).getByTitle(/Go to next page/);
const getTablePrevPageButton = () =>
  within(getNetworksTable()).getByTitle(/Go to previous page/);
const getRowsPerPageSelect = () =>
  within(getNetworksTable()).getByRole('button', { expanded: false });

const setup = (preselectedState: Partial<RootState> = {}) =>
  render(<NetworksConfiguration />, preselectedState);

describe('<NetworksConfiguration />', () => {
  it('should render properly', () => {
    setup();

    const tableRoot = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.TABLE_ROOT);

    expect(tableRoot).toBeVisible();
  });

  it('should render market menu items', async () => {
    const { user, store } = setup();
    const loadedMarketsSelect = getNetworksMarketSelect();

    await waitFor(() => {
      expect(loadedMarketsSelect).toHaveTextContent(mockedMarket.name);
    });

    const marketSelect = getNetworksMarketSelect();
    await user.click(marketSelect);

    const { getByText } = within(screen.getByRole('presentation'));
    const { markets } = selectMarkets(store.getState());
    markets.forEach((market) => expect(getByText(market.name)).toBeVisible());
  });

  it('should change market', async () => {
    const { user, store } = setup();
    const loadedMarketsSelect = getNetworksMarketSelect();

    await waitFor(() => {
      expect(loadedMarketsSelect).toHaveTextContent(mockedMarket.name);
    });

    const marketSelect = getNetworksMarketSelect();
    await user.click(marketSelect);

    const { markets } = selectMarkets(store.getState());
    const { getByText } = within(screen.getByRole('presentation'));
    const newMarketToSet = markets[1];
    const newMarketToSetOption = getByText(newMarketToSet.name);

    await user.click(newMarketToSetOption);
    await waitFor(() => {
      expect(marketSelect).toHaveTextContent(newMarketToSet.name);
    });
  });

  it('should render insurance network rows and navigate between pages', async () => {
    const defaultDisplayedNumberOrRows = 10;
    const { store, user } = setup({
      [NETWORKS_CONFIGURATION_KEY]: {
        ...initialNetworksConfigurationState,
        rowsPerPage: defaultDisplayedNumberOrRows,
      },
    });

    await waitFor(() => {
      const emptySearchResultsElement = queryNoSearchResultsText();
      expect(emptySearchResultsElement).not.toBeInTheDocument();
    });

    const nextPageButton = getTableNextPageButton();
    const prevPageButton = getTablePrevPageButton();
    expect(prevPageButton).toBeDisabled();
    expect(nextPageButton).toBeEnabled();

    const networksSearchParams = selectNetworksConfigurationSearchParams(
      store.getState()
    );
    const { data: allInsuranceNetworks = [] } = selectInsuranceNetworks(
      transformNetworksSearchParamsToDomain(networksSearchParams)
    )(store.getState());

    const firstPage = allInsuranceNetworks.slice(
      0,
      defaultDisplayedNumberOrRows
    );
    firstPage.forEach((network) => {
      const networkRow = getNetworksTableRow(network.id);
      expect(networkRow).toBeVisible();
    });

    await user.click(nextPageButton);
    await waitFor(() => {
      expect(prevPageButton).toBeEnabled();
    });

    const secondPage =
      allInsuranceNetworks?.slice(defaultDisplayedNumberOrRows) || [];
    secondPage.forEach((network) => {
      const networkRow = getNetworksTableRow(network.id);
      expect(networkRow).toBeVisible();
    });
  });

  it('should change table sorting', async () => {
    const { user } = setup({
      [NETWORKS_CONFIGURATION_KEY]: {
        ...initialNetworksConfigurationState,
        rowsPerPage: 10,
      },
    });

    await waitFor(() => {
      const emptySearchResultsElement = queryNoSearchResultsText();
      expect(emptySearchResultsElement).not.toBeInTheDocument();
    });

    const nameHeaderCell = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.TABLE_HEAD_CELL_NAME
    );
    const nameSortButton = within(nameHeaderCell).getByRole('button');
    expect(nameHeaderCell).toHaveAttribute('aria-sort', 'ascending');

    await user.click(nameSortButton);

    await waitFor(() => {
      expect(nameHeaderCell).toHaveAttribute('aria-sort', 'descending');
    });

    const updatedAtHeaderCell = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.TABLE_HEAD_CELL_LAST_UPDATED
    );
    const updatedAtSortButton = within(updatedAtHeaderCell).getByRole('button');

    await user.click(updatedAtSortButton);

    await waitFor(() => {
      expect(updatedAtHeaderCell).toHaveAttribute('aria-sort', 'ascending');
    });

    await user.click(updatedAtSortButton);

    await waitFor(() => {
      expect(updatedAtHeaderCell).toHaveAttribute('aria-sort', 'descending');
    });
  });

  it('should change displayed number of rows per page', async () => {
    const defaultDisplayedNumberOrRows = 10;
    const { user, store } = setup({
      [NETWORKS_CONFIGURATION_KEY]: {
        ...initialNetworksConfigurationState,
        rowsPerPage: defaultDisplayedNumberOrRows,
      },
    });

    await waitFor(() => {
      const emptySearchResultsElement = queryNoSearchResultsText();
      expect(emptySearchResultsElement).not.toBeInTheDocument();
    });

    await waitFor(() => {
      const emptySearchResultsElement = queryNoSearchResultsText();
      expect(emptySearchResultsElement).not.toBeInTheDocument();
    });

    const networksSearchParams = selectNetworksConfigurationSearchParams(
      store.getState()
    );
    const { data: allInsuranceNetworks = [] } = selectInsuranceNetworks(
      transformNetworksSearchParamsToDomain(networksSearchParams)
    )(store.getState());

    const firstPage = allInsuranceNetworks.slice(
      0,
      defaultDisplayedNumberOrRows
    );
    const secondPage = allInsuranceNetworks.slice(defaultDisplayedNumberOrRows);
    firstPage.forEach((network) => {
      const networkRow = getNetworksTableRow(network.id);
      expect(networkRow).toBeVisible();
    });
    secondPage.forEach((network) => {
      const networkRow = queryNetworksTableRow(network.id);
      expect(networkRow).not.toBeInTheDocument();
    });

    const pageSizeSelect = getRowsPerPageSelect();
    await user.click(pageSizeSelect);

    const presentation = await screen.findByRole('presentation');
    const pageSizeOptions = within(presentation).getAllByRole('option');
    const pageSizeOption = pageSizeOptions[1];
    const pageSizeOptionValue = pageSizeOption.getAttribute('data-value');
    await user.click(pageSizeOption);

    allInsuranceNetworks
      .slice(0, Number(pageSizeOptionValue))
      .forEach((network) => {
        const networkRow = getNetworksTableRow(network.id);
        expect(networkRow).toBeVisible();
      });
  });
});
