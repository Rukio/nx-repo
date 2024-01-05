import { render, screen, within } from '../../../testUtils';
import NetworksFilters, { NetworksFiltersProps } from './NetworksFilters';
import { FilterOption } from '../FilterMenu';
import { FILTER_MENU_TESTS_IDS } from '../FilterMenu/testIds';
import { NETWORK_FILTERS_TESTS_IDS } from './testIds';

const DEFAULT_FILTERS: FilterOption[] = [
  {
    title: 'State',
    optionsTitle: 'States',
    options: [
      { id: 1, name: 'First State option' },
      { id: 2, name: 'Second State option' },
      { id: 3, name: 'Third State option' },
      { id: 4, name: 'Fourth State option' },
    ],
    filteredOptions: [
      { id: 1, name: 'First State option' },
      { id: 2, name: 'Second State option' },
      { id: 3, name: 'Third State option' },
      { id: 4, name: 'Fourth State option' },
    ],
    filterBy: ['1'],
    searchText: '',
  },
  {
    title: 'Billing City',
    optionsTitle: 'Billing Cities',
    options: [
      { id: 1, name: 'First City option' },
      { id: 2, name: 'Second City option' },
      { id: 3, name: 'Third City option' },
      { id: 4, name: 'Fourth City option' },
    ],
    filteredOptions: [
      { id: 1, name: 'First City option' },
      { id: 2, name: 'Second City option' },
      { id: 3, name: 'Third City option' },
      { id: 4, name: 'Fourth City option' },
    ],
    filterBy: [],
    searchText: '',
  },
  {
    title: 'Service Line',
    optionsTitle: 'Service Lines',
    options: [
      { id: 1, name: 'First Lines option' },
      { id: 2, name: 'Second Lines option' },
      { id: 3, name: 'Third Lines option' },
      { id: 4, name: 'Fourth Lines option' },
    ],
    filteredOptions: [
      { id: 1, name: 'First Lines option' },
      { id: 2, name: 'Second Lines option' },
      { id: 3, name: 'Third Lines option' },
      { id: 4, name: 'Fourth Lines option' },
    ],
    filterBy: [],
    searchText: '',
  },
  {
    title: 'Modality',
    optionsTitle: 'Modalities',
    options: [
      { id: 1, name: 'First Modality option' },
      { id: 2, name: 'Second Modality option' },
      { id: 3, name: 'Third Modality option' },
      { id: 4, name: 'Fourth Modality option' },
    ],
    filteredOptions: [
      { id: 1, name: 'First Modality option' },
      { id: 2, name: 'Second Modality option' },
      { id: 3, name: 'Third Modality option' },
      { id: 4, name: 'Fourth Modality option' },
    ],
    filterBy: ['2', '4'],
    searchText: '',
  },
];

const mockedProps: NetworksFiltersProps = {
  filters: DEFAULT_FILTERS,
  onFilterByChange: vi.fn(),
  onChangeFilterOptionSearch: vi.fn(),
  onClearFilterOptions: vi.fn(),
  onSelectFilterOptions: vi.fn(),
};

const getFilterChip = (title: string) =>
  screen.getByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsTestId(title));

const queryFilterChips = (title: string) =>
  screen.queryByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsTestId(title));

const setup = (overrideProps: Partial<NetworksFiltersProps> = {}) => {
  const { user } = {
    ...render(<NetworksFilters {...mockedProps} {...overrideProps} />),
  };
  const openFilterMenu = async (filterTitle: string) => {
    const filtersRoot = screen.getByTestId(
      NETWORK_FILTERS_TESTS_IDS.FILTER_ROOT
    );
    const filterChip = getFilterChip(filterTitle);

    expect(filtersRoot).toBeVisible();
    expect(filterChip).toBeVisible();

    await user.click(filterChip);
  };

  return {
    user,
    openFilterMenu,
  };
};

describe('<NetworksFilters />', () => {
  it('should show empty filters', () => {
    setup({ filters: [] });

    DEFAULT_FILTERS.forEach((filter) => {
      const filterElement = queryFilterChips(filter.title);
      expect(filterElement).not.toBeInTheDocument();
    });
  });

  it('should show filters', async () => {
    const { openFilterMenu } = setup();

    for (const filter of DEFAULT_FILTERS) {
      await openFilterMenu(filter.title);

      const filterMenu = screen.getByTestId(
        FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(filter.title)
      );
      const searchField = within(filterMenu).getByTestId(
        FILTER_MENU_TESTS_IDS.FILTER_OPTION_SEARCH_FIELD
      );
      const clearButton = within(filterMenu).getByTestId(
        FILTER_MENU_TESTS_IDS.FILTER_CLEAR_BUTTON
      );
      const doneButton = within(filterMenu).getByTestId(
        FILTER_MENU_TESTS_IDS.FILTER_CLEAR_BUTTON
      );

      expect(filterMenu).toBeVisible();
      expect(searchField).toBeVisible();
      expect(clearButton).toBeVisible();
      expect(doneButton).toBeVisible();

      filter.options.forEach((filterOption) => {
        expect(
          within(filterMenu).getByTestId(
            FILTER_MENU_TESTS_IDS.getFilterOptionTestId(
              filter.title,
              filterOption.id
            )
          )
        ).toBeVisible();
      });
    }
  });

  it('should clear filters', async () => {
    const { user, openFilterMenu } = setup();

    for (const filter of DEFAULT_FILTERS) {
      await openFilterMenu(filter.title);

      const filterMenu = screen.getByTestId(
        FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(filter.title)
      );
      const clearButton = within(filterMenu).getByTestId(
        FILTER_MENU_TESTS_IDS.FILTER_CLEAR_BUTTON
      );

      await user.click(clearButton);

      expect(mockedProps.onClearFilterOptions).toBeCalledWith(filter);
    }
  });

  it('should change filters', async () => {
    const { user, openFilterMenu } = setup();

    for (const filter of DEFAULT_FILTERS) {
      await openFilterMenu(filter.title);

      const filterMenu = screen.getByTestId(
        FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(filter.title)
      );
      const doneButton = within(filterMenu).getByTestId(
        FILTER_MENU_TESTS_IDS.FILTER_DONE_BUTTON
      );

      await user.click(doneButton);

      expect(mockedProps.onSelectFilterOptions).toBeCalledWith(filter);
    }
  });

  it('should change filters items', async () => {
    const { user, openFilterMenu } = setup();

    for (const filter of DEFAULT_FILTERS) {
      await openFilterMenu(filter.title);

      const filterMenu = screen.getByTestId(
        FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(filter.title)
      );

      const filterOption = filter.options[0];
      const filterOptionItem = within(filterMenu).getByTestId(
        FILTER_MENU_TESTS_IDS.getFilterOptionTestId(
          filter.title,
          filterOption.id
        )
      );

      await user.click(filterOptionItem);

      expect(mockedProps.onFilterByChange).toBeCalledWith(
        filter,
        filterOption.id.toString()
      );
    }
  });
});
