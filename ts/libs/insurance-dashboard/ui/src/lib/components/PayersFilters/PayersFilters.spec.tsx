import { render, screen, within } from '../../../testUtils';
import PayersFilters, { PayersFiltersProps } from './PayersFilters';
import { FilterOption } from '../FilterMenu';
import { PAYERS_FILTERS_TESTS_IDS } from './testIds';
import { FILTER_MENU_TESTS_IDS } from '../FilterMenu/testIds';

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

const mockedProps: PayersFiltersProps = {
  searchText: '',
  filters: DEFAULT_FILTERS,
  onFilterByChange: vi.fn(),
  onChangeSearch: vi.fn(),
  onChangeFilterOptionSearch: vi.fn(),
  onClearFilterOptions: vi.fn(),
  onSelectFilterOptions: vi.fn(),
};

const setup = (overrideProps: Partial<PayersFiltersProps> = {}) => ({
  ...render(<PayersFilters {...mockedProps} {...overrideProps} />),
});
const getFilterSearchInput = () =>
  screen.getByTestId(PAYERS_FILTERS_TESTS_IDS.FILTER_SEARCH_FIELD_INPUT);
const queryFilterChip = (title: string) =>
  screen.queryByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsTestId(title));
const getFilterChip = (title: string) =>
  screen.getByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsTestId(title));

describe('<PayersFilters />', () => {
  it('should show empty search text', () => {
    setup();

    const searchInput = getFilterSearchInput();
    expect(searchInput).toBeVisible();
    expect(searchInput).toHaveValue('');
  });

  it('should show search text', () => {
    setup({ searchText: 'Test' });

    const searchInput = getFilterSearchInput();
    expect(searchInput).toBeVisible();
    expect(searchInput).toHaveValue('Test');
  });

  it('should show empty filters', () => {
    setup({ filters: [] });

    DEFAULT_FILTERS.forEach((filter) => {
      const filterElement = queryFilterChip(filter.title);
      expect(filterElement).not.toBeInTheDocument();
    });
  });

  it('should show filters', async () => {
    const { user } = setup();

    DEFAULT_FILTERS.forEach((filter) => {
      const filterChip = getFilterChip(filter.title);
      expect(filterChip).toBeVisible();
    });

    for (const filter of DEFAULT_FILTERS) {
      const filtersRoot = screen.getByTestId(
        PAYERS_FILTERS_TESTS_IDS.FILTER_ROOT
      );
      const filterChip = getFilterChip(filter.title);

      expect(filtersRoot).toBeVisible();
      expect(filterChip).toBeVisible();

      await user.click(filterChip);

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

  it('should call onChangeSearch', async () => {
    const { user } = setup();

    const searchInput = getFilterSearchInput();
    await user.type(searchInput, '1');
    expect(mockedProps.onChangeSearch).toHaveBeenCalledWith('1');
  });
});
