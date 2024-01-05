import {
  RootState,
  INSURANCES_CONFIGURATION_KEY,
  initialInsurancesConfigurationState,
  selectInsuranceClassifications,
  selectMarkets,
  selectInsurancesRowsPerPage,
  transformDomainMarket,
  selectModalities,
  selectSelectedModalityConfigs,
  selectSortedInsurancePlans,
  MARKETS_CONFIGURATION_KEY,
  initialMarketsConfigurationState,
  transformDomainServiceLine,
  setServiceLine,
} from '@*company-data-covered*/modality/data-access';
import {
  INSURANCE_FILTERS_TESTS_IDS,
  INSURANCE_TABLE_TEST_IDS,
} from '@*company-data-covered*/modality/ui';
import {
  mockedMarket as domainMockedMarket,
  mockedServiceLine as domainMockedServiceLine,
} from '@*company-data-covered*/station/data-access';

import { render, screen, within, waitFor } from '../testUtils';
import InsurancesConfiguration from './InsurancesConfiguration';
import { INSURANCE_CONFIGURATION_TEST_IDS } from './testIds';

const mockedMarket = transformDomainMarket(domainMockedMarket);
const mockedServiceLine = transformDomainServiceLine(domainMockedServiceLine);

const setup = (preselectedState?: Partial<RootState>) => {
  const getMarketsSelect = () =>
    screen.getAllByRole('button', {
      ...screen.getByTestId(INSURANCE_CONFIGURATION_TEST_IDS.MARKET_SELECT),
      expanded: false,
    })[0];

  const getInsuranceClassificationsFilterButton = () =>
    screen.getByTestId(INSURANCE_FILTERS_TESTS_IDS.FILTER_BY_SELECT);

  const getInsurancePlansTable = () =>
    screen.getByTestId(INSURANCE_TABLE_TEST_IDS.TABLE_ROOT);

  const getInsurancePlanTableRow = (insurancePlanId: number) =>
    within(getInsurancePlansTable()).getByTestId(
      INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(insurancePlanId)
    );

  const queryNoSearchResultsText = () =>
    screen.queryByTestId(INSURANCE_TABLE_TEST_IDS.TABLE_NO_RESULTS_TEXT);

  return {
    ...render(<InsurancesConfiguration />, preselectedState),
    getMarketsSelect,
    getInsuranceClassificationsFilterButton,
    getInsurancePlansTable,
    getInsurancePlanTableRow,
    queryNoSearchResultsText,
  };
};

describe('<InsurancesConfiguration />', () => {
  it('title should render properly', () => {
    setup();

    const title = screen.getByText('Insurance Configuration');

    expect(title).toBeTruthy();
  });

  it('should render menu items', async () => {
    const { getMarketsSelect, store, user } = setup();

    await waitFor(() => {
      const loadedMarketsSelect = getMarketsSelect();
      expect(loadedMarketsSelect).not.toHaveAttribute('aria-disabled');
    });

    const marketsSelect = getMarketsSelect();
    await user.click(marketsSelect);

    const { getByText } = within(screen.getByRole('presentation'));
    const { markets } = selectMarkets(store.getState());
    markets.forEach((market) => expect(getByText(market.name)).toBeTruthy());
  });

  it('should change market', async () => {
    const { getMarketsSelect, store, user } = setup();
    const description = screen.getByTestId(
      INSURANCE_CONFIGURATION_TEST_IDS.MARKET_DESCRIPTION
    );

    await waitFor(() => {
      const loadedMarketsSelect = getMarketsSelect();
      expect(loadedMarketsSelect).not.toHaveAttribute('aria-disabled');
    });

    const marketsSelect = getMarketsSelect();
    await user.click(marketsSelect);

    const { getByText } = within(screen.getByRole('presentation'));

    const { markets } = selectMarkets(store.getState());

    const newMarketButton = getByText(markets[0].name);
    await user.click(newMarketButton);

    expect(within(description).getByText(markets[0].name)).toBeVisible();
  });

  it('should render insurance classifications filter options', async () => {
    const { getInsuranceClassificationsFilterButton, store, user } = setup();

    await waitFor(() => {
      const updatedFilterButton = getInsuranceClassificationsFilterButton();
      expect(updatedFilterButton).not.toHaveAttribute('aria-disabled');
    });
    const filterButton = getInsuranceClassificationsFilterButton();
    await user.click(filterButton);
    const { data: insuranceClassifications = [] } =
      selectInsuranceClassifications(store.getState());
    const dropdownItems = await screen.findAllByTestId(
      new RegExp(INSURANCE_FILTERS_TESTS_IDS.FILTER_BY_OPTION_PREFIX)
    );
    expect(dropdownItems.length).toEqual(insuranceClassifications?.length);
    insuranceClassifications.forEach((insuranceClassification) => {
      const selectOption = screen.getByTestId(
        INSURANCE_FILTERS_TESTS_IDS.getFilterByOptionTestId(
          insuranceClassification.id
        )
      );
      expect(selectOption).toBeVisible();
    });
  });

  it('should change insurance table filters', async () => {
    const { getInsuranceClassificationsFilterButton, store, user } = setup();

    await waitFor(() => {
      const updatedFilterButton = getInsuranceClassificationsFilterButton();
      expect(updatedFilterButton).not.toHaveAttribute('aria-disabled');
    });
    const filterButton = getInsuranceClassificationsFilterButton();
    await user.click(filterButton);
    const { data: insuranceClassifications = [] } =
      selectInsuranceClassifications(store.getState());

    const dropdownItem = screen.getByTestId(
      INSURANCE_FILTERS_TESTS_IDS.getFilterByOptionTestId(
        insuranceClassifications?.[0].id
      )
    );
    await user.click(dropdownItem);
    const selectedFilter = screen.getByTestId(
      INSURANCE_FILTERS_TESTS_IDS.FILTER_BY_SELECT
    );
    expect(selectedFilter).toHaveTextContent(
      insuranceClassifications?.[0]?.name
    );

    const searchField = screen.getByTestId(
      INSURANCE_FILTERS_TESTS_IDS.SEARCH_FIELD
    );

    await user.type(searchField, 'test');

    await waitFor(() => {
      expect(searchField).toHaveValue('test');
    });
  });

  it('should change insurance table page', async () => {
    const { store, user, queryNoSearchResultsText } = setup({
      [INSURANCES_CONFIGURATION_KEY]: {
        ...initialInsurancesConfigurationState,
        selectedMarket: mockedMarket,
      },
    });
    const insurancePlansTable = screen.getByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_ROOT
    );
    const { getByTitle, getByTestId, queryByTestId } =
      within(insurancePlansTable);

    await waitFor(() => {
      const noSearchResultsText = queryNoSearchResultsText();
      expect(noSearchResultsText).not.toBeInTheDocument();
    });

    const { insurancePlans } = selectSortedInsurancePlans({
      marketId: mockedMarket.id,
      search: initialInsurancesConfigurationState.search,
      classificationId:
        initialInsurancesConfigurationState.selectedInsuranceClassification?.id,
    })(store.getState());
    const rowsPerPage = selectInsurancesRowsPerPage(store.getState());

    const prevPageElement = getByTitle(/Go to previous page/);
    const nextPageElement = getByTitle(/Go to next page/);

    expect(prevPageElement).toBeDisabled();
    expect(nextPageElement).toBeEnabled();
    insurancePlans.slice(0, rowsPerPage).forEach((insurancePlan) => {
      expect(
        getByTestId(
          INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(insurancePlan.id)
        )
      ).toBeVisible();
    });
    insurancePlans.slice(rowsPerPage).forEach((insurancePlan) => {
      expect(
        queryByTestId(
          INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(insurancePlan.id)
        )
      ).toBeFalsy();
    });

    await user.click(nextPageElement);

    await waitFor(() => {
      expect(nextPageElement).toBeDisabled();
    });
    expect(prevPageElement).toBeEnabled();
    insurancePlans.slice(0, rowsPerPage).forEach((insurancePlan) => {
      expect(
        queryByTestId(
          INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(insurancePlan.id)
        )
      ).toBeFalsy();
    });
    insurancePlans.slice(rowsPerPage).forEach((insurancePlan) => {
      expect(
        getByTestId(
          INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(insurancePlan.id)
        )
      ).toBeVisible();
    });
  });

  it('should change insurance table sorting', async () => {
    const { user, queryNoSearchResultsText } = setup({
      [INSURANCES_CONFIGURATION_KEY]: {
        ...initialInsurancesConfigurationState,
        selectedMarket: mockedMarket,
      },
    });
    const insurancePlansTable = screen.getByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_ROOT
    );
    const { getByTestId } = within(insurancePlansTable);

    await waitFor(() => {
      const noSearchResultsText = queryNoSearchResultsText();
      expect(noSearchResultsText).not.toBeInTheDocument();
    });

    const nameHeaderCell = getByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_HEADER_CELL_NAME
    );

    const nameSortButton = within(nameHeaderCell).getByRole('button');

    expect(nameHeaderCell).toHaveAttribute('aria-sort', 'ascending');

    await user.click(nameSortButton);

    await waitFor(() => {
      expect(nameHeaderCell).toHaveAttribute('aria-sort', 'descending');
    });

    const updatedAtHeaderCell = getByTestId(
      INSURANCE_TABLE_TEST_IDS.TABLE_HEADER_CELL_LAST_UPDATED
    );

    const updatedAtSortButton = within(updatedAtHeaderCell).getByRole('button');

    expect(updatedAtHeaderCell).not.toHaveAttribute('aria-sort');

    await user.click(updatedAtSortButton);

    await waitFor(() => {
      expect(updatedAtHeaderCell).toHaveAttribute('aria-sort', 'ascending');
    });

    await user.click(updatedAtSortButton);

    await waitFor(() => {
      expect(updatedAtHeaderCell).toHaveAttribute('aria-sort', 'descending');
    });
  });

  it('should change markets displayed rows per page', async () => {
    const { store, user, getInsurancePlansTable, queryNoSearchResultsText } =
      setup({
        [INSURANCES_CONFIGURATION_KEY]: {
          ...initialInsurancesConfigurationState,
          selectedMarket: mockedMarket,
        },
      });
    const insurancePlansTable = getInsurancePlansTable();
    const { getByRole, getByTestId, queryByTestId } =
      within(insurancePlansTable);

    await waitFor(() => {
      const noSearchResultsText = queryNoSearchResultsText();
      expect(noSearchResultsText).not.toBeInTheDocument();
    });

    const { insurancePlans } = selectSortedInsurancePlans({
      marketId: mockedMarket.id,
      search: initialInsurancesConfigurationState.search,
      classificationId:
        initialInsurancesConfigurationState.selectedInsuranceClassification?.id,
    })(store.getState());
    const rowsPerPage = selectInsurancesRowsPerPage(store.getState());

    const pageSizeSelect = getByRole('button', { expanded: false });

    insurancePlans.slice(0, rowsPerPage).forEach((insurancePlan) => {
      expect(
        getByTestId(
          INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(insurancePlan.id)
        )
      ).toBeVisible();
    });
    insurancePlans.slice(rowsPerPage).forEach((insurancePlan) => {
      expect(
        queryByTestId(
          INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(insurancePlan.id)
        )
      ).toBeFalsy();
    });

    await user.click(pageSizeSelect);
    const presentation = await screen.findByRole('presentation');
    const pageSizeOptions = within(presentation).getAllByRole('option');
    await user.click(pageSizeOptions[1]);

    await waitFor(() => {
      insurancePlans.forEach((insurancePlan) => {
        expect(
          getByTestId(
            INSURANCE_TABLE_TEST_IDS.getInsurancePlanRowTestId(insurancePlan.id)
          )
        ).toBeVisible();
      });
    });
  });

  it('should toggle insurances modality configs', async () => {
    const { store, user, getInsurancePlanTableRow, queryNoSearchResultsText } =
      setup({
        [INSURANCES_CONFIGURATION_KEY]: {
          ...initialInsurancesConfigurationState,
          selectedMarket: mockedMarket,
        },
        [MARKETS_CONFIGURATION_KEY]: {
          ...initialMarketsConfigurationState,
          selectedServiceLine: mockedServiceLine,
        },
      });

    await waitFor(() => {
      const noSearchResultsText = queryNoSearchResultsText();
      expect(noSearchResultsText).not.toBeInTheDocument();
    });

    const { insurancePlans } = selectSortedInsurancePlans({
      marketId: mockedMarket.id,
      search: initialInsurancesConfigurationState.search,
      classificationId:
        initialInsurancesConfigurationState.selectedInsuranceClassification?.id,
    })(store.getState());

    const { modalities } = selectModalities(store.getState());
    const selectedModalities = selectSelectedModalityConfigs(store.getState());

    const insurancePlan = insurancePlans[0];
    const modality = modalities[0];
    const insurancePlanRow = getInsurancePlanTableRow(insurancePlan.id);

    const modalityCell = within(insurancePlanRow).getByTestId(
      INSURANCE_TABLE_TEST_IDS.getModalityCellTestId(modality.id)
    );
    const isDefaultChecked = !!selectedModalities[mockedMarket.id]?.[
      insurancePlan.id
    ]?.includes(modality.id);

    const modalityToggle = within(modalityCell).getByRole('checkbox');

    expect(modalityToggle).toHaveProperty('checked', isDefaultChecked);

    await user.click(modalityToggle);

    await waitFor(() => {
      expect(modalityToggle).toHaveProperty('checked', !isDefaultChecked);
    });
  });

  it('should not toggle insurances modality configs if service line not selected', async () => {
    const { store, user, getInsurancePlanTableRow, queryNoSearchResultsText } =
      setup({
        [INSURANCES_CONFIGURATION_KEY]: {
          ...initialInsurancesConfigurationState,
          selectedMarket: mockedMarket,
        },
      });

    await waitFor(() => {
      const noSearchResultsText = queryNoSearchResultsText();
      expect(noSearchResultsText).not.toBeInTheDocument();
    });

    // override default service line
    store.dispatch(setServiceLine({ selectedServiceLine: undefined }));
    const { insurancePlans } = selectSortedInsurancePlans({
      marketId: mockedMarket.id,
      search: initialInsurancesConfigurationState.search,
      classificationId:
        initialInsurancesConfigurationState.selectedInsuranceClassification?.id,
    })(store.getState());

    const { modalities } = selectModalities(store.getState());
    const selectedModalities = selectSelectedModalityConfigs(store.getState());

    const insurancePlan = insurancePlans[0];
    const modality = modalities[0];
    const insurancePlanRow = getInsurancePlanTableRow(insurancePlan.id);

    const modalityCell = within(insurancePlanRow).getByTestId(
      INSURANCE_TABLE_TEST_IDS.getModalityCellTestId(modality.id)
    );
    const isDefaultChecked = !!selectedModalities[mockedMarket.id]?.[
      insurancePlan.id
    ]?.includes(modality.id);

    const modalityToggle = within(modalityCell).getByRole('checkbox');

    expect(modalityToggle).toHaveProperty('checked', isDefaultChecked);

    await user.click(modalityToggle);

    await waitFor(() => {
      expect(modalityToggle).not.toHaveProperty('checked', !isDefaultChecked);
    });
  });
});
