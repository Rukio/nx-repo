import { render, screen } from '../../../testUtils';
import { FILTER_MENU_TESTS_IDS } from './testIds';
import FilterMenu, { FilterOption, FilterMenuProps } from './FilterMenu';

const DEFAULT_FILTER: FilterOption = {
  title: 'State',
  optionsTitle: 'States',
  options: [
    { id: '1', name: 'First State option' },
    { id: '2', name: 'Second State option' },
    { id: '3', name: 'Third State option' },
    { id: '4', name: 'Fourth State option' },
  ],
  filteredOptions: [
    { id: '1', name: 'First State option' },
    { id: '2', name: 'Second State option' },
    { id: '3', name: 'Third State option' },
    { id: '4', name: 'Fourth State option' },
  ],
  filterBy: ['1'],
  searchText: '',
};

const mockedProps: FilterMenuProps = {
  filter: DEFAULT_FILTER,
  onFilterByChange: vi.fn(),
  onChangeFilterOptionSearch: vi.fn(),
  onClearFilterOptions: vi.fn(),
  onSelectFilterOptions: vi.fn(),
};

const setup = (overrideProps: Partial<FilterMenuProps> = {}) => {
  const getFilterChip = (title: string) =>
    screen.getByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsTestId(title));
  const queryFilterChips = (title: string) =>
    screen.queryByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsTestId(title));

  const getFilterChipsMenu = (title: string) =>
    screen.getByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(title));
  const findFilterChipsMenu = (title: string) =>
    screen.findByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(title));
  const queryFilterChipsMenu = (title: string) =>
    screen.queryByTestId(FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(title));

  const getFilterOption = (title: string, optionId: string | number) =>
    screen.getByTestId(
      FILTER_MENU_TESTS_IDS.getFilterOptionTestId(title, optionId)
    );
  const findFilterOption = (title: string, optionId: string | number) =>
    screen.findByTestId(
      FILTER_MENU_TESTS_IDS.getFilterOptionTestId(title, optionId)
    );
  const queryFilterOption = (title: string, optionId: string | number) =>
    screen.queryByTestId(
      FILTER_MENU_TESTS_IDS.getFilterOptionTestId(title, optionId)
    );

  return {
    ...render(<FilterMenu {...{ ...mockedProps, ...overrideProps }} />),
    getFilterChip,
    queryFilterChips,
    getFilterChipsMenu,
    findFilterChipsMenu,
    queryFilterChipsMenu,
    getFilterOption,
    findFilterOption,
    queryFilterOption,
  };
};

describe('<FilterMenu />', () => {
  it('should show filter menu and options', async () => {
    const {
      user,
      queryFilterChipsMenu,
      getFilterChip,
      findFilterChipsMenu,
      getFilterOption,
    } = setup();

    expect(queryFilterChipsMenu(DEFAULT_FILTER.title)).not.toBeInTheDocument();

    const filter = getFilterChip(DEFAULT_FILTER.title);
    await user.click(filter);
    expect(await findFilterChipsMenu(DEFAULT_FILTER.title)).toBeVisible();
    expect(
      getFilterOption(DEFAULT_FILTER.title, DEFAULT_FILTER.options[0].id)
    ).toBeVisible();
  });

  it('should call onFilterByChange', async () => {
    const { user, getFilterChipsMenu, getFilterChip, findFilterOption } =
      setup();

    const filter = getFilterChip(DEFAULT_FILTER.title);
    await user.click(filter);
    expect(getFilterChipsMenu(DEFAULT_FILTER.title)).toBeVisible();
    const filterOption = await findFilterOption(
      DEFAULT_FILTER.title,
      DEFAULT_FILTER.options[0].id
    );
    expect(filterOption).toBeVisible();
    await user.click(filterOption);
    expect(mockedProps.onFilterByChange).toHaveBeenCalledWith(
      DEFAULT_FILTER,
      DEFAULT_FILTER.options[0].id
    );
  });

  it('should call onChangeFilterOptionSearch', async () => {
    const { user, getFilterChipsMenu, getFilterChip } = setup();

    const filter = getFilterChip(DEFAULT_FILTER.title);
    await user.click(filter);
    expect(getFilterChipsMenu(DEFAULT_FILTER.title)).toBeVisible();

    const filterOptionSearchInput = await screen.findByTestId(
      FILTER_MENU_TESTS_IDS.FILTER_OPTION_SEARCH_FIELD
    );
    expect(filterOptionSearchInput).toBeVisible();
    await user.type(filterOptionSearchInput, '1');
    expect(mockedProps.onChangeFilterOptionSearch).toHaveBeenCalledWith(
      DEFAULT_FILTER,
      '1'
    );
  });

  it('should call onClearFilterOptions', async () => {
    const { user, getFilterChipsMenu, getFilterChip } = setup();

    const filter = getFilterChip(DEFAULT_FILTER.title);
    await user.click(filter);
    expect(getFilterChipsMenu(DEFAULT_FILTER.title)).toBeVisible();
    const filterOptionClearButton = await screen.findByTestId(
      FILTER_MENU_TESTS_IDS.FILTER_CLEAR_BUTTON
    );
    expect(filterOptionClearButton).toBeVisible();
    await user.click(filterOptionClearButton);
    expect(mockedProps.onClearFilterOptions).toHaveBeenCalledWith(
      DEFAULT_FILTER
    );
  });

  it('should call onSelectFilterOptions', async () => {
    const { user, getFilterChipsMenu, getFilterChip } = setup();

    const filter = getFilterChip(DEFAULT_FILTER.title);
    await user.click(filter);
    expect(getFilterChipsMenu(DEFAULT_FILTER.title)).toBeVisible();
    const filterOptionDoneButton = await screen.findByTestId(
      FILTER_MENU_TESTS_IDS.FILTER_DONE_BUTTON
    );
    expect(filterOptionDoneButton).toBeVisible();
    await user.click(filterOptionDoneButton);
    expect(mockedProps.onSelectFilterOptions).toHaveBeenCalledWith(
      DEFAULT_FILTER
    );
  });

  it('should show default chip label', () => {
    const { getFilterChip } = setup({
      ...mockedProps,
      filter: { ...mockedProps.filter, filterBy: [] },
    });

    const filter = getFilterChip(DEFAULT_FILTER.title);
    expect(filter).toBeVisible();
    expect(filter).toHaveTextContent(mockedProps.filter.title);
  });

  it('should show chip label with selected state', () => {
    const { getFilterChip } = setup();

    const filter = getFilterChip(DEFAULT_FILTER.title);
    expect(filter).toBeVisible();
    expect(filter).toHaveTextContent(mockedProps.filter.options[0].name);
  });

  it('should show chip label with selected states', () => {
    const { getFilterChip } = setup({
      ...mockedProps,
      filter: { ...mockedProps.filter, filterBy: ['1', '2'] },
    });

    const filter = getFilterChip(DEFAULT_FILTER.title);
    expect(filter).toBeVisible();
    expect(filter).toHaveTextContent('First State option, Second State...');
  });
});
