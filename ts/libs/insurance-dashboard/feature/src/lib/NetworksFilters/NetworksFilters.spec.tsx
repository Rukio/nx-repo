import {
  NETWORK_FILTERS_TESTS_IDS,
  FILTER_MENU_TESTS_IDS,
  NETWORKS_TABLE_TEST_IDS,
  filterMenuOptionPrefixText,
  filterMenuItemPrefixText,
  FilterOption,
  filterMenuChipPrefixText,
} from '@*company-data-covered*/insurance/ui';
import { render, screen, within } from '../../testUtils';
import NetworksFilters, { FilterOptionTitle } from './NetworksFilters';
import {
  SelectedNetworksFilterOptions,
  AppliedNetworksFilterOptions,
  manageNetworksInitialState,
  mockedFilteredByClassificationInsuranceNetworksList,
  mockedFilteredByStateInsuranceNetworksList,
  mockedInsuranceClassifications,
  mockedInsuranceNetworksList,
  mockedStates,
} from '@*company-data-covered*/insurance/data-access';
import NetworksList from '../NetworksList/NetworksList';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useParams: vi.fn(() => ({ payerId: '1' })),
  };
});

const mockedFilters: FilterOption[] = [
  {
    title: FilterOptionTitle.STATE,
    optionsTitle: 'States',
    options: mockedStates.map((state) => ({
      id: state.abbreviation,
      name: state.name,
    })),
    filteredOptions: [mockedStates[0]],
    filterBy: [mockedStates[0].abbreviation],
    searchText: 'Pennsylvania',
  },
  {
    title: FilterOptionTitle.CLASSIFICATION,
    optionsTitle: 'Classifications',
    options: mockedInsuranceClassifications,
    filteredOptions: [mockedInsuranceClassifications[1]],
    filterBy: [mockedInsuranceClassifications[1].id.toString()],
    searchText: 'Awesome Classification 2',
  },
];

const getFilterChip = (filterTitle: FilterOptionTitle) =>
  screen.getByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsTestId(filterTitle));
const getFilterMenu = (filterTitle: FilterOptionTitle) =>
  screen.getByTestId(
    FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(filterTitle)
  );
const getFilterMenuOption = (filterTitle: FilterOptionTitle, id: string) => {
  const filterByStateMenuOption = screen.getByTestId(
    FILTER_MENU_TESTS_IDS.getFilterOptionTestId(filterTitle, id)
  );

  return within(filterByStateMenuOption).getByRole('checkbox');
};
const getFilterMenuClearButton = (filterMenu: HTMLElement) =>
  within(filterMenu).getByTestId(FILTER_MENU_TESTS_IDS.FILTER_CLEAR_BUTTON);
const getFilterMenuDoneButton = (filterMenu: HTMLElement) =>
  within(filterMenu).getByTestId(FILTER_MENU_TESTS_IDS.FILTER_DONE_BUTTON);
const findTableRowNetworkLinks = () => {
  const table = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);

  return within(table).findAllByTestId(
    new RegExp(NETWORKS_TABLE_TEST_IDS.TABLE_ROW_LINK_PREFIX)
  );
};

const setup = () =>
  render(
    <>
      <NetworksFilters />
      <NetworksList />
    </>
  );

const setupWithInitiallyFilteredNetworks = (
  filterOptions: Pick<
    AppliedNetworksFilterOptions,
    'stateAbbrs' | 'insuranceClassifications'
  >,
  selectedFilterOptions: SelectedNetworksFilterOptions
) =>
  render(
    <>
      <NetworksFilters />
      <NetworksList />
    </>,
    {
      withRouter: true,
      preloadedState: {
        manageNetworks: {
          ...manageNetworksInitialState,
          appliedFilterOptions: {
            ...manageNetworksInitialState.appliedFilterOptions,
            ...filterOptions,
          },
          selectedFilterOptions,
        },
      },
    }
  );

describe('<NetworksFilters />', () => {
  it('should render properly', async () => {
    setup();
    const networksFiltersComponent = screen.getByTestId(
      NETWORK_FILTERS_TESTS_IDS.FILTER_ROOT
    );
    expect(networksFiltersComponent).toBeVisible();

    const filters = screen.getAllByTestId(new RegExp(filterMenuChipPrefixText));
    expect(filters.length).toEqual(mockedFilters.length);

    const filterByStateChip = getFilterChip(FilterOptionTitle.STATE);
    expect(filterByStateChip).toBeVisible();
    expect(filterByStateChip).toHaveTextContent(FilterOptionTitle.STATE);

    const filterByClassificationChip = getFilterChip(
      FilterOptionTitle.CLASSIFICATION
    );
    expect(filterByClassificationChip).toBeVisible();
    expect(filterByClassificationChip).toHaveTextContent(
      FilterOptionTitle.CLASSIFICATION
    );

    const table = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);
    expect(table).toBeVisible();

    const tableRowNetworkLinks = await findTableRowNetworkLinks();
    expect(tableRowNetworkLinks.length).toEqual(
      mockedInsuranceNetworksList.length
    );
  });
});

describe.each([
  {
    filterOptionTitle: FilterOptionTitle.STATE,
    mockedFilterOptions: mockedFilters[0].options,
    mockedFilterSearchText: mockedFilters[0].searchText,
    mockedFilteredOptions: mockedFilters[0].filteredOptions,
    mockedFilteredInsuranceNetworksList:
      mockedFilteredByStateInsuranceNetworksList,
    appliedFilterOptions: { stateAbbrs: mockedFilters[0].filterBy },
    selectedFilterOptions: {
      selectedStateAbbrs: mockedFilters[0].filterBy,
      selectedInsuranceClassifications: [],
    },
    filterBy: mockedFilters[0].filterBy,
  },
  {
    filterOptionTitle: FilterOptionTitle.CLASSIFICATION,
    mockedFilterOptions: mockedFilters[1].options,
    mockedFilterSearchText: mockedFilters[1].searchText,
    mockedFilteredOptions: mockedFilters[1].filteredOptions,
    mockedFilteredInsuranceNetworksList:
      mockedFilteredByClassificationInsuranceNetworksList,
    appliedFilterOptions: {
      insuranceClassifications: mockedFilters[1].filterBy,
    },
    selectedFilterOptions: {
      selectedStateAbbrs: [],
      selectedInsuranceClassifications: mockedFilters[1].filterBy,
    },
    filterBy: mockedFilters[1].filterBy,
  },
])(
  'Networks Filters',
  ({
    filterOptionTitle,
    mockedFilterOptions,
    mockedFilterSearchText,
    mockedFilteredOptions,
    mockedFilteredInsuranceNetworksList,
    appliedFilterOptions,
    selectedFilterOptions,
    filterBy,
  }) => {
    it(`should open menu, render ${filterOptionTitle} filter options and control buttons`, async () => {
      const { user } = setup();

      const filterChip = getFilterChip(filterOptionTitle);
      await user.click(filterChip);

      const filterMenu = getFilterMenu(filterOptionTitle);
      expect(filterMenu).toBeVisible();

      const filterMenuItems = within(filterMenu).getAllByTestId(
        new RegExp(`${filterMenuItemPrefixText}-${filterOptionTitle}`)
      );
      filterMenuItems.forEach((item, index) => {
        expect(item).toHaveTextContent(mockedFilterOptions[index].name);
        const itemCheckbox = within(item).getByRole('checkbox');
        expect(itemCheckbox).not.toBeChecked();
      });

      const buttonClear = getFilterMenuClearButton(filterMenu);
      expect(buttonClear).toBeVisible();

      const buttonDone = getFilterMenuDoneButton(filterMenu);
      expect(buttonDone).toBeVisible();
    });

    it(`should render search field for ${filterOptionTitle} filter menu`, async () => {
      const { user } = setup();

      const filterChip = getFilterChip(filterOptionTitle);
      await user.click(filterChip);

      const filterMenu = getFilterMenu(filterOptionTitle);
      expect(
        within(filterMenu).getByTestId(
          FILTER_MENU_TESTS_IDS.FILTER_OPTION_SEARCH_FIELD
        )
      ).toBeVisible();
    });

    it(`should filter options by entered search value for ${filterOptionTitle} filter menu`, async () => {
      const { user } = setup();

      const filterChip = getFilterChip(filterOptionTitle);
      await user.click(filterChip);

      const filterMenuOptions = screen.getAllByTestId(
        new RegExp(`${filterMenuItemPrefixText}-${filterOptionTitle}`)
      );
      expect(filterMenuOptions).toHaveLength(mockedFilterOptions.length);
      filterMenuOptions.forEach((option, index) => {
        expect(option).toHaveTextContent(mockedFilterOptions[index].name);
      });

      const filterMenuSearchField = screen.getByTestId(
        FILTER_MENU_TESTS_IDS.FILTER_OPTION_SEARCH_FIELD
      );
      expect(filterMenuSearchField).toBeVisible();
      expect(filterMenuSearchField).toHaveValue('');

      await user.type(filterMenuSearchField, mockedFilterSearchText);

      expect(filterMenuSearchField).toHaveValue(mockedFilterSearchText);

      const filteredMenuOptions = screen.getAllByTestId(
        new RegExp(`${filterMenuItemPrefixText}-${filterOptionTitle}`)
      );
      expect(filteredMenuOptions).toHaveLength(mockedFilteredOptions.length);
      expect(filteredMenuOptions[0]).toHaveTextContent(
        mockedFilteredOptions[0].name
      );
    });

    it(`should select and unselect ${filterOptionTitle} filter options`, async () => {
      const { user } = setup();
      const filterChip = getFilterChip(filterOptionTitle);
      await user.click(filterChip);

      const filterMenu = getFilterMenu(filterOptionTitle);
      const filterMenuItems = within(filterMenu).getAllByRole('menuitem');
      expect(filterMenuItems.length).toEqual(mockedFilterOptions.length);

      const filterMenuFirstOption = getFilterMenuOption(
        filterOptionTitle,
        mockedFilterOptions[0].id.toString()
      );
      expect(filterMenuFirstOption).not.toBeChecked();
      await user.click(filterMenuFirstOption);
      expect(filterMenuFirstOption).toBeChecked();

      const filterMenuSecondOption = getFilterMenuOption(
        filterOptionTitle,
        mockedFilterOptions[1].id.toString()
      );
      expect(filterMenuSecondOption).not.toBeChecked();
      await user.click(filterMenuSecondOption);
      expect(filterMenuSecondOption).toBeChecked();

      await user.click(filterMenuFirstOption);
      expect(filterMenuFirstOption).not.toBeChecked();
    });

    it(`should filter networks by selected ${filterOptionTitle} option and show filtered networks in table`, async () => {
      const { user } = setup();
      const tableRowNetworkLinks = await findTableRowNetworkLinks();
      expect(tableRowNetworkLinks.length).toEqual(
        mockedInsuranceNetworksList.length
      );

      const filterChip = getFilterChip(filterOptionTitle);
      await user.click(filterChip);

      const filterMenuOption = getFilterMenuOption(
        filterOptionTitle,
        filterBy[0]
      );
      await user.click(filterMenuOption);
      expect(filterMenuOption).toBeChecked();

      const filterMenu = getFilterMenu(filterOptionTitle);
      const buttonDone = getFilterMenuDoneButton(filterMenu);
      expect(buttonDone).toBeVisible();
      await user.click(buttonDone);

      const tableRowFilteredNetworkLinks = await findTableRowNetworkLinks();
      expect(tableRowFilteredNetworkLinks.length).toEqual(
        mockedFilteredInsuranceNetworksList.length
      );
      expect(tableRowFilteredNetworkLinks[0]).toHaveTextContent(
        mockedFilteredInsuranceNetworksList[0].name
      );
    });

    it(`should reset ${filterOptionTitle} filter and show all networks in table`, async () => {
      const { user } = setupWithInitiallyFilteredNetworks(
        appliedFilterOptions,
        selectedFilterOptions
      );

      const tableRowFilteredNetworkLinks = await findTableRowNetworkLinks();
      expect(tableRowFilteredNetworkLinks.length).toEqual(
        mockedFilteredInsuranceNetworksList.length
      );

      const filterChip = getFilterChip(filterOptionTitle);
      await user.click(filterChip);

      const filterMenu = getFilterMenu(filterOptionTitle);
      const buttonClear = getFilterMenuClearButton(filterMenu);
      await user.click(buttonClear);
      await user.click(filterChip);

      const filterMenuOptions = screen.getAllByTestId(
        new RegExp(`${filterMenuOptionPrefixText}-${filterOptionTitle}`)
      );
      filterMenuOptions.forEach((option) => {
        const filterMenuOptionCheckbox = within(option).getByRole('checkbox');
        expect(filterMenuOptionCheckbox).not.toBeChecked();
      });

      const tableRowNetworkLinks = await findTableRowNetworkLinks();
      expect(tableRowNetworkLinks.length).toEqual(
        mockedInsuranceNetworksList.length
      );
      expect(tableRowNetworkLinks[0]).toHaveTextContent(
        mockedInsuranceNetworksList[0].name
      );
    });

    it(`should not update table with empty selected ${filterOptionTitle} filter options`, async () => {
      const { user } = setup();

      const tableRowFilteredNetworkLinks = await findTableRowNetworkLinks();
      expect(tableRowFilteredNetworkLinks.length).toEqual(
        mockedInsuranceNetworksList.length
      );

      const filterChip = getFilterChip(filterOptionTitle);
      await user.click(filterChip);

      const filterMenuOptions = screen.getAllByTestId(
        new RegExp(`${filterMenuOptionPrefixText}-${filterOptionTitle}`)
      );
      filterMenuOptions.forEach((option) => {
        const filterMenuOptionCheckbox = within(option).getByRole('checkbox');
        expect(filterMenuOptionCheckbox).not.toBeChecked();
      });

      const networksFiltersComponent = screen.getByTestId(
        NETWORK_FILTERS_TESTS_IDS.FILTER_ROOT
      );

      await user.click(networksFiltersComponent);

      const tableRowNetworkLinks = await findTableRowNetworkLinks();
      expect(tableRowNetworkLinks.length).toEqual(
        mockedInsuranceNetworksList.length
      );
    });
  }
);
