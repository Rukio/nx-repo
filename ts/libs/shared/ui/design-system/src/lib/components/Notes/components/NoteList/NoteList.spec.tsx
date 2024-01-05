import {
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '../../../../../test-utils';
import { NOTES_TEST_IDS } from '../../testIds';
import NoteList, { FilterOption, NoteListProps } from './NoteList';

const setup = (props: Partial<NoteListProps> = {}) => {
  const fakeChildrenDataTestId = 'children-test-id';

  const getFilterSelect = () =>
    screen.getByTestId(NOTES_TEST_IDS.FILTER_SELECT);

  const queryFilterSelect = () =>
    screen.queryByTestId(NOTES_TEST_IDS.FILTER_SELECT);

  return {
    ...render(
      <NoteList {...props}>
        <div data-testid={fakeChildrenDataTestId} />
      </NoteList>
    ),
    fakeChildrenDataTestId,
    user: userEvent.setup(),
    getFilterSelect,
    queryFilterSelect,
  };
};

describe('NoteList', () => {
  test('should render default list label and children in list correctly', async () => {
    const { fakeChildrenDataTestId } = setup();

    const notesList = await screen.findByTestId(NOTES_TEST_IDS.LIST);
    expect(notesList).toBeVisible();

    const children = within(notesList).getByTestId(fakeChildrenDataTestId);
    expect(children).toBeVisible();

    const notesListLabel = screen.getByTestId(NOTES_TEST_IDS.LIST_LABEL);
    expect(notesListLabel).toBeVisible();
    expect(notesListLabel).toHaveTextContent('Notes');
  });

  test('should render without list and list label correctly', () => {
    render(<NoteList listLabel={null} />);

    const notesList = screen.queryByTestId(NOTES_TEST_IDS.LIST);
    expect(notesList).not.toBeInTheDocument();

    const notesListLabel = screen.queryByTestId(NOTES_TEST_IDS.LIST_LABEL);
    expect(notesListLabel).not.toBeInTheDocument();
  });

  test('should not render filter select if filter options list is empty', () => {
    const { queryFilterSelect } = setup();

    const filterSelect = queryFilterSelect();
    expect(filterSelect).not.toBeInTheDocument();
  });

  test('should render filter select and menu items correctly', async () => {
    const mockFilterOption = { label: 'test', value: 'testValue' };
    const { user, getFilterSelect } = setup({
      filterOptions: [mockFilterOption],
    });

    const filterSelect = getFilterSelect();
    expect(filterSelect).toBeVisible();

    await user.click(within(filterSelect).getByRole('button'));

    const filterOption = await screen.findByTestId(
      NOTES_TEST_IDS.getFilterOptionTestIdByValue(mockFilterOption.value)
    );
    expect(filterOption).toBeVisible();
    expect(filterOption).toBeEnabled();

    await user.click(filterOption);

    await waitFor(() => {
      expect(filterSelect).toHaveTextContent(mockFilterOption.label);
    });
  });

  test('should render filter select and menu items correctly with default value', async () => {
    const mockDefaultFilterOption: FilterOption = {
      label: 'default',
      value: 'defaultValue',
    };
    const mockFilterOption: FilterOption = {
      label: 'test',
      value: 'testValue',
    };
    const { user, getFilterSelect } = setup({
      filterOptions: [mockDefaultFilterOption, mockFilterOption],
      defaultFilterValue: mockDefaultFilterOption.value,
    });

    const filterSelect = getFilterSelect();
    expect(filterSelect).toBeVisible();

    expect(filterSelect).toHaveTextContent(mockDefaultFilterOption.label);

    await user.click(within(filterSelect).getByRole('button'));

    const filterOption = await screen.findByTestId(
      NOTES_TEST_IDS.getFilterOptionTestIdByValue(mockFilterOption.value)
    );
    expect(filterOption).toBeVisible();
    expect(filterOption).toBeEnabled();

    await user.click(filterOption);

    await waitFor(() => {
      expect(filterSelect).toHaveTextContent(mockFilterOption.label);
    });
  });

  test('should render filter select and menu items correctly with disabled option', async () => {
    const mockDefaultFilterOption: FilterOption = {
      label: 'default',
      value: 'defaultValue',
    };
    const mockFilterOption: FilterOption = {
      label: 'test',
      value: 'testValue',
      disabled: true,
    };
    const { user, getFilterSelect } = setup({
      filterOptions: [mockDefaultFilterOption, mockFilterOption],
      defaultFilterValue: mockDefaultFilterOption.value,
    });

    const filterSelect = getFilterSelect();
    expect(filterSelect).toBeVisible();

    expect(filterSelect).toHaveTextContent(mockDefaultFilterOption.label);

    await user.click(within(filterSelect).getByRole('button'));

    const filterOption = await screen.findByTestId(
      NOTES_TEST_IDS.getFilterOptionTestIdByValue(mockFilterOption.value)
    );
    expect(filterOption).toBeVisible();
    expect(filterOption).toHaveAttribute('aria-disabled', 'true');
  });
});
