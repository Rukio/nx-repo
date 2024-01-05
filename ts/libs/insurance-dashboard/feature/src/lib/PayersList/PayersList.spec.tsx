import {
  PAYERS_TABLE_TEST_IDS,
  PAYERS_FILTERS_TESTS_IDS,
  FILTER_MENU_TESTS_IDS,
  FilterOption,
  FilterOptionTitle,
  filterMenuItemPrefixText,
} from '@*company-data-covered*/insurance/ui';
import {
  mockedInsurancePayer,
  mockedStates,
  DomainInsurancePayer,
  mockedInsurancePayerGroups,
} from '@*company-data-covered*/insurance/data-access';
import { render, screen, waitFor, within } from '../../testUtils';
import PayersList, { transformPayersForUI } from './PayersList';
import { rest } from 'msw';
import { mswServer } from '../../testUtils/server';
import {
  environment,
  PAYERS_API_PATH,
} from '@*company-data-covered*/insurance/data-access';
import { INSURANCE_DASHBOARD_ROUTES } from '../constants';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

export const mockedFilters: FilterOption[] = [
  {
    title: 'State',
    optionsTitle: 'States',
    options: mockedStates,
    filteredOptions: [mockedStates[0]],
    filterBy: [mockedStates[0].id.toString()],
    searchText: '',
  },
];

const getTableRoot = () => screen.getByTestId(PAYERS_TABLE_TEST_IDS.TABLE_ROOT);

const getFilterRoot = () =>
  screen.getByTestId(PAYERS_FILTERS_TESTS_IDS.FILTER_ROOT);

const getSearchField = () =>
  screen.getByTestId(PAYERS_FILTERS_TESTS_IDS.FILTER_SEARCH_FIELD);

const getSearchFieldInput = () =>
  screen.getByTestId(PAYERS_FILTERS_TESTS_IDS.FILTER_SEARCH_FIELD_INPUT);

const getClearButton = () =>
  screen.getByTestId(FILTER_MENU_TESTS_IDS.FILTER_CLEAR_BUTTON);

const getDoneButton = () =>
  screen.getByTestId(FILTER_MENU_TESTS_IDS.FILTER_DONE_BUTTON);

const getFilterChip = (title: string) =>
  screen.getByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsTestId(title));

const getPayerTableRow = (payerId: number) =>
  screen.getByTestId(PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payerId));

const findPayerTableRow = (payerId: number) =>
  screen.findByTestId(PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payerId));

const getFilterOption = (
  filterTitle: string,
  filterOptionId: number | string
) =>
  screen.getByTestId(
    FILTER_MENU_TESTS_IDS.getFilterOptionTestId(filterTitle, filterOptionId)
  );

const getFilterOptionCheckboxInput = (
  filterTitle: string,
  filterOptionId: number | string
) =>
  within(
    screen.getByTestId(
      FILTER_MENU_TESTS_IDS.getFilterOptionTestId(filterTitle, filterOptionId)
    )
  ).getByRole('checkbox');

const getMockedInsurancePayers = (count: number) =>
  Array.from(Array(count), (_, index) => ({
    ...mockedInsurancePayer,
    name: mockedInsurancePayer.name + index,
    id: mockedInsurancePayer.id + index,
  }));

const getPaginationPrevButton = () =>
  screen.getByTitle<HTMLButtonElement>('Go to previous page');

const getPaginationNextButton = () =>
  screen.getByTitle<HTMLButtonElement>('Go to next page');

const getPaginationSelectButton = () => {
  const pagination = screen.getByTestId(PAYERS_TABLE_TEST_IDS.TABLE_PAGINATION);

  return within(pagination).getByRole('button', {
    name: /25/i,
  });
};

const getPaginationSelectOption = (option: string) =>
  screen.getByRole('option', { name: new RegExp(option, 'i') });

const findTableRowHeaders = () => {
  const table = getTableRoot();

  return within(table).findAllByTestId(
    new RegExp(PAYERS_TABLE_TEST_IDS.TABLE_ROW_NAME_CELL_PREFIX)
  );
};

const getFilterMenu = (title: string) =>
  screen.getByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(title));

describe('<PayersList />', () => {
  it('should render properly', async () => {
    render(<PayersList />);

    const table = getTableRoot();
    const link = await screen.findByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowLinkTestId(mockedInsurancePayer.id)
    );

    expect(link).toHaveAttribute(
      'href',
      INSURANCE_DASHBOARD_ROUTES.getPayerDetailsTabPath(mockedInsurancePayer.id)
    );

    expect(table).toBeVisible();

    const payerGroupCell = within(table).getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellTestId(mockedInsurancePayer.id)
    );
    expect(payerGroupCell).toBeVisible();
    expect(payerGroupCell).toHaveTextContent(
      mockedInsurancePayerGroups[0].name
    );
  });

  it('table row should not expand when clicking on a link', async () => {
    const { user } = render(<PayersList />);

    const link = await screen.findByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowLinkTestId(mockedInsurancePayer.id)
    );

    await user.click(link);

    expect(
      screen.getByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(
          mockedInsurancePayer.id
        )
      )
    ).toBeVisible();
  });

  it('transformPayersForUI should return correct data', () => {
    const result = transformPayersForUI([mockedInsurancePayer]);
    expect(result).toEqual([
      {
        ...mockedInsurancePayer,
        link: INSURANCE_DASHBOARD_ROUTES.getPayerDetailsTabPath(
          mockedInsurancePayer.id
        ),
      },
    ]);
  });

  it('should render filters', async () => {
    render(<PayersList />);

    const filter = getFilterRoot();
    const filterSearchField = getSearchField();

    expect(filter).toBeVisible();
    expect(filterSearchField).toBeVisible();

    const table = getTableRoot();
    expect(table).toBeVisible();

    const tableHeader = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER
    );
    const tableHeaderCellSortByNameLabel = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_NAME_LABEL
    );
    const tableHeaderCellSortByUpdatedAtLabel = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_UPDATED_AT_LABEL
    );
    const tableHeaderCellNetworks = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_NETWORKS
    );
    const tableHeaderCellStates = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_STATES
    );
    const tableHeaderCellPayerGroup = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_GROUP
    );
    const tableHeaderCellLastUpdated = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_LAST_UPDATED
    );

    expect(tableHeader).toBeVisible();
    expect(tableHeaderCellSortByNameLabel).toBeVisible();
    expect(tableHeaderCellSortByUpdatedAtLabel).toBeVisible();
    expect(tableHeaderCellNetworks).toBeVisible();
    expect(tableHeaderCellStates).toBeVisible();
    expect(tableHeaderCellPayerGroup).toBeVisible();
    expect(tableHeaderCellLastUpdated).toBeVisible();

    const tablePagination = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_PAGINATION
    );
    expect(tablePagination).toBeVisible();

    const tableRow = await findPayerTableRow(mockedInsurancePayer.id);
    const tableRowNetworkCell = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowNetworkCellTestId(
        mockedInsurancePayer.id
      )
    );
    const tableRowServiceLineCell = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowStateCellTestId(mockedInsurancePayer.id)
    );
    const tableRowNetworkValue = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowNetworkCellValueTestId(
        mockedInsurancePayer.id,
        mockedInsurancePayer.insuranceNetworks[0].id
      )
    );
    const tableRowStateValue = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowStateCellValueTestId(
        mockedInsurancePayer.id,
        mockedInsurancePayer.stateAbbrs[0]
      )
    );

    expect(tableRow).toBeVisible();
    expect(tableRowNetworkCell).toBeVisible();
    expect(tableRowServiceLineCell).toBeVisible();
    expect(tableRowNetworkValue).toBeVisible();
    expect(tableRowStateValue).toBeVisible();
  });

  it('should have payers ascending by default and change to descending when clicked on Payer header', async () => {
    const { user } = render(<PayersList />);

    const tableHeaderCellSortLabel = await screen.findByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_NAME_LABEL
    );

    expect(
      await screen.findByTestId(PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER)
    ).toHaveAttribute('aria-sort', 'ascending');

    await user.click(tableHeaderCellSortLabel);

    await waitFor(async () => {
      expect(
        await screen.findByTestId(PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER)
      ).toHaveAttribute('aria-sort', 'descending');
    });
  });

  it('should have payers ascending by default and change to descending when clicked on Last Updated header', async () => {
    const { user } = render(<PayersList />);

    const tableHeaderCellSortLabel = await screen.findByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_UPDATED_AT_LABEL
    );

    expect(
      await screen.findByTestId(
        PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_LAST_UPDATED
      )
    ).toHaveAttribute('aria-sort', 'ascending');

    await user.click(tableHeaderCellSortLabel);

    await waitFor(async () => {
      expect(
        await screen.findByTestId(
          PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_LAST_UPDATED
        )
      ).toHaveAttribute('aria-sort', 'descending');
    });
  });

  describe.each([{ rowsPerPage: 25 }, { rowsPerPage: 50 }])(
    'if user selected $rowsPerPage rows per page',
    ({ rowsPerPage }) => {
      it(`should see next ${rowsPerPage} payers after proceeding to next page if number of payers >= ${
        rowsPerPage * 2
      }`, async () => {
        const mockedInsurancePayers = getMockedInsurancePayers(rowsPerPage * 2);

        mswServer.use(
          rest.get(
            `${environment.serviceURL}${PAYERS_API_PATH}`,
            (_req, res, ctx) => {
              return res.once(
                ctx.status(200),
                ctx.json({
                  payers: mockedInsurancePayers,
                })
              );
            }
          )
        );
        const { user } = render(<PayersList />);

        const paginationSelectButton = getPaginationSelectButton();
        await user.click(paginationSelectButton);

        const paginationSelectOption = getPaginationSelectOption(
          String(rowsPerPage)
        );
        await user.click(paginationSelectOption);

        const nextPageButton = getPaginationNextButton();
        await user.click(nextPageButton);

        const tableRowHeaders = await findTableRowHeaders();
        expect(tableRowHeaders[0]).toHaveTextContent(
          mockedInsurancePayers[rowsPerPage].name
        );
      });

      it(`should see first ${rowsPerPage} payers sorted by alphabetical order after proceeding back to first page`, async () => {
        const mockedInsurancePayers = getMockedInsurancePayers(rowsPerPage * 2);
        mswServer.use(
          rest.get(
            `${environment.serviceURL}${PAYERS_API_PATH}`,
            (_req, res, ctx) => {
              return res.once(
                ctx.status(200),
                ctx.json({
                  payers: mockedInsurancePayers,
                })
              );
            }
          )
        );
        const { user } = render(<PayersList />);

        const paginationSelectButton = getPaginationSelectButton();
        await user.click(paginationSelectButton);

        const paginationSelectOption = getPaginationSelectOption(
          String(rowsPerPage)
        );
        await user.click(paginationSelectOption);

        const nextPageButton = getPaginationNextButton();
        await user.click(nextPageButton);

        const previousPageButton = getPaginationPrevButton();
        await user.click(previousPageButton);

        const tableRowHeaders = await findTableRowHeaders();

        expect(tableRowHeaders[0]).toHaveTextContent(
          mockedInsurancePayers[0].name
        );
        expect(tableRowHeaders[rowsPerPage - 1]).toHaveTextContent(
          mockedInsurancePayers[rowsPerPage - 1].name
        );
      });

      it(`should see 1 payer on the next page if total number of payers % ${rowsPerPage} === 1`, async () => {
        const mockedInsurancePayers = getMockedInsurancePayers(rowsPerPage + 1);
        mswServer.use(
          rest.get(
            `${environment.serviceURL}${PAYERS_API_PATH}`,
            (_req, res, ctx) => {
              return res.once(
                ctx.status(200),
                ctx.json({
                  payers: mockedInsurancePayers,
                })
              );
            }
          )
        );

        const { user } = render(<PayersList />);

        const paginationSelectButton = getPaginationSelectButton();
        await user.click(paginationSelectButton);

        const paginationSelectOption = getPaginationSelectOption(
          String(rowsPerPage)
        );
        await user.click(paginationSelectOption);

        const nextPageButton = getPaginationNextButton();
        await user.click(nextPageButton);

        const tableRowHeaders = await findTableRowHeaders();
        expect(tableRowHeaders).toHaveLength(1);
      });

      it(`should see ${
        rowsPerPage - 1
      } payers on the next page if total number of payers % ${rowsPerPage} === ${
        rowsPerPage - 1
      }`, async () => {
        const mockedInsurancePayers = getMockedInsurancePayers(
          rowsPerPage * 2 - 1
        );

        mswServer.use(
          rest.get(
            `${environment.serviceURL}${PAYERS_API_PATH}`,
            (_req, res, ctx) => {
              return res.once(
                ctx.status(200),
                ctx.json({
                  payers: mockedInsurancePayers,
                })
              );
            }
          )
        );
        const { user } = render(<PayersList />);

        const paginationSelectButton = getPaginationSelectButton();
        await user.click(paginationSelectButton);

        const paginationSelectOption = getPaginationSelectOption(
          String(rowsPerPage)
        );
        await user.click(paginationSelectOption);

        const nextPageButton = getPaginationNextButton();
        await user.click(nextPageButton);

        const tableRowHeaders = await findTableRowHeaders();
        expect(tableRowHeaders).toHaveLength(rowsPerPage - 1);
      });

      it(`should see next/back buttons disabled if there are <${rowsPerPage} payers overall`, async () => {
        const mockedInsurancePayers = getMockedInsurancePayers(rowsPerPage - 1);

        mswServer.use(
          rest.get(
            `${environment.serviceURL}${PAYERS_API_PATH}`,
            (_req, res, ctx) => {
              return res.once(
                ctx.status(200),
                ctx.json({
                  payers: mockedInsurancePayers,
                })
              );
            }
          )
        );
        const { user } = render(<PayersList />);

        const paginationSelectButton = getPaginationSelectButton();
        await user.click(paginationSelectButton);

        const paginationSelectOption = getPaginationSelectOption(
          String(rowsPerPage)
        );
        await user.click(paginationSelectOption);

        const previousPageButton = getPaginationPrevButton();
        expect(previousPageButton).toBeDisabled();

        const nextPageButton = getPaginationNextButton();
        expect(nextPageButton).toBeDisabled();
      });
    }
  );

  it('should filter options by entered search value', async () => {
    const { user } = render(<PayersList />);

    const mockFilter = mockedFilters[0];
    const mockedState = mockedStates[0];

    const filter = getFilterRoot();
    expect(filter).toBeVisible();

    const filterStateChip = getFilterChip(mockFilter.title);
    expect(filterStateChip).toBeVisible();

    await user.click(filterStateChip);

    const filterMenuOptions = screen.getAllByTestId(
      new RegExp(`${filterMenuItemPrefixText}-${FilterOptionTitle.STATE}`)
    );
    expect(filterMenuOptions).toHaveLength(mockFilter.options.length);
    filterMenuOptions.forEach((option, index) => {
      expect(option).toHaveTextContent(mockFilter.options[index].name);
    });

    const filterMenuSearchField = screen.getByTestId(
      FILTER_MENU_TESTS_IDS.FILTER_OPTION_SEARCH_FIELD
    );
    expect(filterMenuSearchField).toBeVisible();
    expect(filterMenuSearchField).toHaveValue('');

    await user.type(filterMenuSearchField, mockedState.name);

    expect(filterMenuSearchField).toHaveValue(mockedState.name);

    const filteredMenuOptions = screen.getAllByTestId(
      new RegExp(`${filterMenuItemPrefixText}-${FilterOptionTitle.STATE}`)
    );
    expect(filteredMenuOptions).toHaveLength(mockFilter.filteredOptions.length);
    expect(filteredMenuOptions[0]).toHaveTextContent(
      mockFilter.filteredOptions[0].name
    );
  });

  it('should select/unselect state filter option', async () => {
    const { user } = render(<PayersList />);

    const mockFilter = mockedFilters[0];
    const mockedState = mockedStates[0];

    const filter = getFilterRoot();
    expect(filter).toBeVisible();
    const filterStateChip = getFilterChip(mockFilter.title);
    expect(filterStateChip).toBeVisible();

    await user.click(filterStateChip);

    const filterMenu = getFilterMenu(mockFilter.title);
    expect(filterMenu).toBeVisible();

    const filterMenuItem = getFilterOption(
      mockFilter.title,
      mockedState.abbreviation
    );
    expect(filterMenuItem).toBeVisible();

    await user.click(filterMenuItem);

    const filterMenuItemInput = getFilterOptionCheckboxInput(
      mockFilter.title,
      mockedState.abbreviation
    );

    expect(filterMenuItemInput).toBeChecked();

    await user.click(filterMenuItem);

    expect(filterMenuItemInput).not.toBeChecked();
  });

  it('should clear state filter options', async () => {
    const { user } = render(<PayersList />);

    const mockFilter = mockedFilters[0];
    const mockedState = mockedStates[0];

    const filter = getFilterRoot();
    expect(filter).toBeVisible();
    const filterStateChip = getFilterChip(mockFilter.title);
    expect(filterStateChip).toBeVisible();

    await user.click(filterStateChip);

    const filterMenu = getFilterMenu(mockFilter.title);
    expect(filterMenu).toBeVisible();

    const filterMenuItem = getFilterOption(
      mockFilter.title,
      mockedState.abbreviation
    );
    expect(filterMenuItem).toBeVisible();

    await user.click(filterMenuItem);

    const filterMenuItemInput = getFilterOptionCheckboxInput(
      mockFilter.title,
      mockedState.abbreviation
    );

    expect(filterMenuItemInput).toBeChecked();

    const clearButton = getClearButton();
    expect(clearButton).toBeVisible();

    await user.click(clearButton);

    const newFilterStateChip = getFilterChip(mockFilter.title);
    expect(newFilterStateChip).toBeVisible();

    await user.click(newFilterStateChip);

    const newFilterMenu = getFilterMenu(mockFilter.title);
    expect(newFilterMenu).toBeVisible();

    for (const mockedStateItem of mockedStates) {
      const newFilterMenuItem = getFilterOption(
        mockFilter.title,
        mockedState.abbreviation
      );
      expect(newFilterMenuItem).toBeVisible();

      await user.click(filterMenuItem);
      const newFilterMenuItemInput = getFilterOptionCheckboxInput(
        mockFilter.title,
        mockedStateItem.abbreviation
      );
      expect(newFilterMenuItemInput).not.toBeChecked();
    }
  });

  it('should select state filter options on Done button clicked', async () => {
    const { user } = render(<PayersList />);

    const mockFilter = mockedFilters[0];
    const mockedState = mockedStates[0];

    const filter = getFilterRoot();
    expect(filter).toBeVisible();
    const filterStateChip = getFilterChip(mockFilter.title);
    expect(filterStateChip).toBeVisible();

    await user.click(filterStateChip);

    const filterMenu = getFilterMenu(mockFilter.title);
    expect(filterMenu).toBeVisible();

    const filterMenuItem = getFilterOption(
      mockFilter.title,
      mockedState.abbreviation
    );
    expect(filterMenuItem).toBeVisible();

    await user.click(filterMenuItem);

    const filterMenuItemInput = getFilterOptionCheckboxInput(
      mockFilter.title,
      mockedState.abbreviation
    );

    expect(filterMenuItemInput).toBeChecked();

    const doneButton = getDoneButton();
    expect(doneButton).toBeVisible();

    await user.click(doneButton);

    const filterStateChipsWithSelectedOption = getFilterChip(mockFilter.title);

    expect(filterStateChipsWithSelectedOption).toHaveTextContent(
      mockedState.name
    );
  });

  it('should search payer by name search string', async () => {
    const searchString = 'test';
    const mockedInsurancePayers = getMockedInsurancePayers(10);
    const { user } = render(<PayersList />);

    const filter = getFilterRoot();
    const filterSearchField = getSearchField();

    expect(filter).toBeVisible();
    expect(filterSearchField).toBeVisible();

    const filterSearchFieldInput = getSearchFieldInput();

    expect(filterSearchFieldInput).toHaveValue('');

    const tableRoot = getTableRoot();
    expect(tableRoot).toBeVisible();
    const payer = mockedInsurancePayers[0];
    await waitFor(() => {
      expect(getPayerTableRow(payer.id)).toBeVisible();
    });

    const mockedInsurancePayersWithSearchString: DomainInsurancePayer[] = [
      { ...mockedInsurancePayers[0], id: 300, name: searchString },
    ];

    mswServer.use(
      rest.get(
        `${environment.serviceURL}${PAYERS_API_PATH}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({
              payers: mockedInsurancePayersWithSearchString,
            })
          );
        }
      )
    );

    await user.type(filterSearchFieldInput, searchString);

    expect(filterSearchFieldInput).toHaveValue(searchString);

    const searchedPayer = mockedInsurancePayersWithSearchString[0];
    await waitFor(() => {
      expect(getPayerTableRow(searchedPayer.id)).toBeVisible();
    });
  });

  it('should search payer by state', async () => {
    const mockedInsurancePayers = getMockedInsurancePayers(10);
    const { user } = render(<PayersList />);

    const tableRoot = getTableRoot();
    expect(tableRoot).toBeVisible();

    const mockFilter = mockedFilters[0];
    const mockedState = mockedStates[0];

    const filter = getFilterRoot();
    expect(filter).toBeVisible();
    const filterStateChip = getFilterChip(mockFilter.title);
    expect(filterStateChip).toBeVisible();

    await user.click(filterStateChip);

    const filterMenu = getFilterMenu(mockFilter.title);
    expect(filterMenu).toBeVisible();

    const filterMenuItem = getFilterOption(
      mockFilter.title,
      mockedState.abbreviation
    );
    expect(filterMenuItem).toBeVisible();

    const mockedInsurancePayersWithStateSearch: DomainInsurancePayer[] = [
      { ...mockedInsurancePayers[0], id: 300 },
    ];

    mswServer.use(
      rest.get(
        `${environment.serviceURL}${PAYERS_API_PATH}`,
        (_req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({
              payers: mockedInsurancePayersWithStateSearch,
            })
          );
        }
      )
    );

    await user.click(filterMenuItem);

    const filterMenuItemInput = getFilterOptionCheckboxInput(
      mockFilter.title,
      mockedState.abbreviation
    );

    expect(filterMenuItemInput).toBeChecked();

    const doneButton = getDoneButton();
    expect(doneButton).toBeVisible();

    await user.click(doneButton);

    const searchedPayer = mockedInsurancePayersWithStateSearch[0];
    await waitFor(() => {
      expect(getPayerTableRow(searchedPayer.id)).toBeVisible();
    });
  });

  it('should reset filters options on remount', async () => {
    const { user, rerender, store } = render(<PayersList />);

    const mockFilter = mockedFilters[0];
    const mockedState = mockedStates[0];

    const filter = getFilterRoot();
    expect(filter).toBeVisible();
    const filterStateChip = getFilterChip(mockFilter.title);
    expect(filterStateChip).toBeVisible();

    await user.click(filterStateChip);

    const filterMenu = getFilterMenu(mockFilter.title);
    expect(filterMenu).toBeVisible();

    const filterMenuItem = getFilterOption(
      mockFilter.title,
      mockedState.abbreviation
    );
    expect(filterMenuItem).toBeVisible();

    await user.click(filterMenuItem);

    const filterMenuItemInput = getFilterOptionCheckboxInput(
      mockFilter.title,
      mockedState.abbreviation
    );

    expect(filterMenuItemInput).toBeChecked();

    const doneButton = getDoneButton();
    expect(doneButton).toBeVisible();

    await user.click(doneButton);

    const filterStateChipsWithSelectedOption = getFilterChip(mockFilter.title);

    expect(filterStateChipsWithSelectedOption).toHaveTextContent(
      mockedState.name
    );

    rerender(
      <Provider store={store}>
        <MemoryRouter>
          <PayersList />
        </MemoryRouter>
      </Provider>
    );

    const resetedFilterStateChip = getFilterChip(mockFilter.title);
    expect(resetedFilterStateChip).toBeVisible();

    await user.click(resetedFilterStateChip);

    const resetedFilterMenu = getFilterMenu(mockFilter.title);
    expect(resetedFilterMenu).toBeVisible();

    const resetedFilterMenuItem = getFilterOption(
      mockFilter.title,
      mockedState.abbreviation
    );
    expect(resetedFilterMenuItem).toBeVisible();

    await user.click(resetedFilterMenuItem);

    const resetedFilterMenuItemInput = getFilterOptionCheckboxInput(
      mockFilter.title,
      mockedState.abbreviation
    );

    expect(resetedFilterMenuItemInput).not.toBeChecked();
  });
});
