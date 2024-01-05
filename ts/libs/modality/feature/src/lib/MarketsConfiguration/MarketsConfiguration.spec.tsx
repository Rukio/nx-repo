import {
  RootState,
  selectServiceLines,
  selectMarkets,
  selectRowsPerPage,
  selectModalities,
  selectSelectedMarketsModalityConfigs,
  MARKETS_CONFIGURATION_KEY,
  initialMarketsConfigurationState,
  transformDomainServiceLine,
  setServiceLine,
} from '@*company-data-covered*/modality/data-access';
import { mockedServiceLine as domainMockedServiceLine } from '@*company-data-covered*/station/data-access';
import { MARKETS_TABLE_TEST_IDS } from '@*company-data-covered*/modality/ui';

import { render, screen, waitFor, within } from '../testUtils';
import MarketsConfiguration from './MarketsConfiguration';
import { MARKETS_CONFIGURATION_TEST_IDS } from './testIds';

const mockedServiceLine = transformDomainServiceLine(domainMockedServiceLine);

const setup = (preselectedState?: Partial<RootState>) => {
  const getServiceLineSelect = () =>
    screen.getAllByRole('button', {
      ...screen.getByTestId(MARKETS_CONFIGURATION_TEST_IDS.SERVICE_LINE_SELECT),
      expanded: false,
    })[0];

  return {
    ...render(<MarketsConfiguration />, preselectedState),
    getServiceLineSelect,
  };
};

describe('<MarketsConfiguration />', () => {
  it('title should render properly', () => {
    setup();

    const title = screen.getByText('Market Modality Configuration');

    expect(title).toBeTruthy();
  });

  it('should render service lines menu items', async () => {
    const { store, getServiceLineSelect, user } = setup();
    const serviceLineSelect = getServiceLineSelect();
    expect(serviceLineSelect).toHaveAttribute('aria-disabled', 'true');

    await waitFor(() => {
      const updatedServiceLineSelect = getServiceLineSelect();
      expect(updatedServiceLineSelect).not.toHaveAttribute('aria-disabled');
    });
    await user.click(serviceLineSelect);
    const dropdownItems = await screen.findAllByTestId(
      new RegExp(
        MARKETS_CONFIGURATION_TEST_IDS.SELECT_SERVICE_LINE_OPTION_PREFIX
      )
    );
    const { serviceLines } = selectServiceLines(store.getState());
    expect(dropdownItems.length).toEqual(serviceLines.length);
    const dropdownValues = dropdownItems.map((item) =>
      item.getAttribute('data-value')
    );
    expect(serviceLines.map((serviceLine) => String(serviceLine.id))).toEqual(
      dropdownValues
    );
  });

  it('should change selected service line', async () => {
    const { store, getServiceLineSelect, user } = setup();

    await waitFor(() => {
      const updatedServiceLineSelect = getServiceLineSelect();
      expect(updatedServiceLineSelect).not.toHaveAttribute('aria-disabled');
    });

    const serviceLineSelect = getServiceLineSelect();
    const { serviceLines } = selectServiceLines(store.getState());
    const defaultServiceLine = serviceLines.find((sl) => sl.default);
    expect(serviceLineSelect).toHaveTextContent(defaultServiceLine?.name ?? '');

    user.click(serviceLineSelect);
    const serviceLineOption = await screen.findByTestId(
      MARKETS_CONFIGURATION_TEST_IDS.getServiceLineOptionTestId(
        serviceLines[1].id
      )
    );
    user.click(serviceLineOption);

    await waitFor(() => {
      expect(serviceLineSelect).toHaveTextContent(serviceLines[1].name);
    });
  });

  it('should render markets table', async () => {
    const { store } = setup();
    const marketsTable = screen.getByTestId(MARKETS_TABLE_TEST_IDS.TABLE_ROOT);
    expect(marketsTable).toBeInTheDocument();
    const marketsTableCount = within(marketsTable).getByText(/0–0/);
    expect(marketsTableCount).toBeVisible();
    const rowsPerPage = selectRowsPerPage(store.getState());

    await waitFor(() => {
      const oldMarketsTableCount = within(marketsTable).queryByText(/0–0/);
      expect(oldMarketsTableCount).toBeFalsy();
    });

    const { markets } = selectMarkets(store.getState());
    markets.slice(0, rowsPerPage).forEach((market) => {
      expect(
        screen.getByTestId(
          `${MARKETS_TABLE_TEST_IDS.TABLE_ROW_PREFIX}-${market.id}`
        )
      ).toBeVisible();
    });
  });

  it('should change markets table page', async () => {
    const { store, user } = setup();
    const marketsTable = screen.getByTestId(MARKETS_TABLE_TEST_IDS.TABLE_ROOT);
    const { queryByText, getByTitle, getByTestId, queryByTestId } =
      within(marketsTable);

    await waitFor(() => {
      const oldMarketsTableCount = queryByText(/0–0/);
      expect(oldMarketsTableCount).toBeFalsy();
    });

    const { markets } = selectMarkets(store.getState());
    const rowsPerPage = selectRowsPerPage(store.getState());

    const prevPageElement = getByTitle(/Go to previous page/);
    const nextPageElement = getByTitle(/Go to next page/) as HTMLButtonElement;

    expect(prevPageElement).toHaveAttribute('disabled');
    expect(nextPageElement).not.toHaveAttribute('disabled');
    markets.slice(0, rowsPerPage).forEach((market) => {
      expect(
        getByTestId(MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id))
      ).toBeVisible();
    });
    markets.slice(rowsPerPage).forEach((market) => {
      expect(
        queryByTestId(MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id))
      ).toBeFalsy();
    });

    await user.click(nextPageElement);

    await waitFor(() => {
      expect(nextPageElement).toHaveAttribute('disabled');
    });
    expect(prevPageElement).not.toHaveAttribute('disabled');
    markets.slice(0, rowsPerPage).forEach((market) => {
      expect(
        queryByTestId(MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id))
      ).toBeFalsy();
    });
    markets.slice(rowsPerPage).forEach((market) => {
      expect(
        getByTestId(MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id))
      ).toBeVisible();
    });
  });

  it('should change markets displayed rows per page', async () => {
    const { store, user } = setup();
    const marketsTable = screen.getByTestId(MARKETS_TABLE_TEST_IDS.TABLE_ROOT);
    const { queryByText, getByRole, getByTestId, queryByTestId } =
      within(marketsTable);

    await waitFor(() => {
      const oldMarketsTableCount = queryByText(/0–0/);
      expect(oldMarketsTableCount).toBeFalsy();
    });

    const { markets } = selectMarkets(store.getState());
    const rowsPerPage = selectRowsPerPage(store.getState());

    const pageSizeSelect = getByRole('button', { expanded: false });

    markets.slice(0, rowsPerPage).forEach((market) => {
      expect(
        getByTestId(MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id))
      ).toBeVisible();
    });
    markets.slice(rowsPerPage).forEach((market) => {
      expect(
        queryByTestId(MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id))
      ).toBeFalsy();
    });

    await user.click(pageSizeSelect);
    const presentation = await screen.findByRole('presentation');
    const pageSizeOptions = within(presentation).getAllByRole('option');
    await user.click(pageSizeOptions[1]);

    await waitFor(() => {
      markets.forEach((market) => {
        expect(
          getByTestId(MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id))
        ).toBeVisible();
      });
    });
  });

  it('should toggle markets modality configs', async () => {
    const { store, user } = setup({
      [MARKETS_CONFIGURATION_KEY]: {
        ...initialMarketsConfigurationState,
        selectedServiceLine: mockedServiceLine,
      },
    });
    const marketsTable = screen.getByTestId(MARKETS_TABLE_TEST_IDS.TABLE_ROOT);
    const { queryByText, getByTestId } = within(marketsTable);

    await waitFor(() => {
      const oldMarketsTableCount = queryByText(/0–0/);
      expect(oldMarketsTableCount).not.toBeInTheDocument();
    });

    const { markets } = selectMarkets(store.getState());
    const { modalities } = selectModalities(store.getState());
    const selectedMarketsModalities = selectSelectedMarketsModalityConfigs(
      store.getState()
    );
    const market = markets[0];
    const modality = modalities[0];
    const marketTableRow = getByTestId(
      MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id)
    );

    const modalityCell = within(marketTableRow).getByTestId(
      MARKETS_TABLE_TEST_IDS.getModalityCellTestId(modality.id)
    );
    const isDefaultChecked = !!selectedMarketsModalities[market.id]?.includes(
      modality.id
    );
    const modalityToggle = within(modalityCell).getByRole('checkbox');

    expect(modalityToggle).toHaveProperty('checked', isDefaultChecked);

    await user.click(modalityToggle);

    await waitFor(() => {
      expect(modalityToggle).toHaveProperty('checked', !isDefaultChecked);
    });
  });

  it('should not toggle markets modality configs if no service line selected', async () => {
    const { store, user } = setup();
    const marketsTable = screen.getByTestId(MARKETS_TABLE_TEST_IDS.TABLE_ROOT);
    const { queryByText, getByTestId } = within(marketsTable);

    await waitFor(() => {
      const oldMarketsTableCount = queryByText(/0–0/);
      expect(oldMarketsTableCount).not.toBeInTheDocument();
    });
    // force set undefined as serviceLine to replace default service line
    store.dispatch(setServiceLine({ selectedServiceLine: undefined }));
    const { markets } = selectMarkets(store.getState());
    const { modalities } = selectModalities(store.getState());
    const selectedMarketsModalities = selectSelectedMarketsModalityConfigs(
      store.getState()
    );
    const market = markets[0];
    const modality = modalities[0];
    const marketTableRow = getByTestId(
      MARKETS_TABLE_TEST_IDS.getMarketRowTestId(market.id)
    );

    const modalityCell = within(marketTableRow).getByTestId(
      MARKETS_TABLE_TEST_IDS.getModalityCellTestId(modality.id)
    );
    const isDefaultChecked = !!selectedMarketsModalities[market.id]?.includes(
      modality.id
    );
    const modalityToggle = within(modalityCell).getByRole('checkbox');

    expect(modalityToggle).toHaveProperty('checked', isDefaultChecked);

    await user.click(modalityToggle);

    await waitFor(() => {
      expect(modalityToggle).toHaveProperty('checked', isDefaultChecked);
    });
  });
});
