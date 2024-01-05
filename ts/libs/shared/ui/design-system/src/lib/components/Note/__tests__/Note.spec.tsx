import { WithReadMore } from '../__storybook__/Note.stories';
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from '../../../../test-utils';
import Note, {
  getInitials,
  getSecondaryLabel,
  getUpdatedAtLabel,
  NoteProps,
} from '..';
import { NOTE_TEST_IDS } from '../testIds';

const mockDefaultProps: NoteProps = {
  id: 1,
  text: 'Lorem enim tempor ex nulla amet ullamco.',
  displayDate: '2020-07-08T00:00:00.305Z',
  firstName: 'John',
  lastName: 'Dow',
  jobTitle: 'RN',
};

const setup = (props: Partial<NoteProps> = {}) => {
  const user = userEvent.setup({ delay: null });

  const openMoreMenu = async () => {
    const moreButton = screen.getByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).toBeVisible();
    expect(moreButton).toBeEnabled();

    await user.click(moreButton);
  };

  const clickMenuItem = async (menuItemTestId: string, textContent: string) => {
    const menuItem = await screen.findByTestId(menuItemTestId);
    expect(menuItem).toBeVisible();
    expect(menuItem).toBeEnabled();
    expect(menuItem).toHaveTextContent(textContent);

    await user.click(menuItem);
  };

  return {
    ...render(<Note {...mockDefaultProps} {...props} />),
    user,
    openMoreMenu,
    clickMenuItem,
  };
};

describe('Note', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('snapshots', () => {
    test('should render note with initials', () => {
      const { asFragment } = setup();
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render note without initials', () => {
      const { asFragment } = setup({ showInitials: false });
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render featured note with initials', () => {
      const { asFragment } = setup({ featured: true });
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render featured note without initials', () => {
      const { asFragment } = setup({ featured: true, showInitials: false });
      expect(asFragment()).toMatchSnapshot();
    });

    it('should render snapshot with read more button correctly', () => {
      const { asFragment } = render(
        <WithReadMore
          {...mockDefaultProps}
          text="Dolore in irure eu eiusmod adipisicing id laboris culpa aliqua"
        />
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it('should render snapshot without read more button correctly if text is empty', () => {
      const { asFragment } = render(
        <WithReadMore {...mockDefaultProps} text="" />
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });

  test('should render note correctly with initials', async () => {
    setup();

    const initials = await screen.findByTestId(NOTE_TEST_IDS.INITIALS);
    expect(initials).toBeVisible();
    expect(initials).toHaveTextContent('JD');

    const displayName = await screen.findByTestId(NOTE_TEST_IDS.DISPLAY_NAME);
    expect(displayName).toBeVisible();
    expect(displayName).toHaveTextContent('John Dow, RN');

    const secondaryLabel = await screen.findByTestId(
      NOTE_TEST_IDS.SECONDARY_LABEL
    );
    expect(secondaryLabel).toBeVisible();
    expect(secondaryLabel).toHaveTextContent('7/7/2020 at 06:00 PM MDT');

    const text = await screen.findByTestId(NOTE_TEST_IDS.TEXT);
    expect(text).toBeVisible();
    expect(text).toHaveTextContent('Lorem enim tempor ex nulla amet ullamco.');
  });

  test('should render note correctly without initials', async () => {
    setup({ showInitials: false });

    const initials = screen.queryByTestId(NOTE_TEST_IDS.INITIALS);
    expect(initials).not.toBeInTheDocument();

    const displayName = await screen.findByTestId(NOTE_TEST_IDS.DISPLAY_NAME);
    expect(displayName).toBeVisible();
    expect(displayName).toHaveTextContent('John Dow, RN');

    const secondaryLabel = await screen.findByTestId(
      NOTE_TEST_IDS.SECONDARY_LABEL
    );
    expect(secondaryLabel).toBeVisible();
    expect(secondaryLabel).toHaveTextContent('7/7/2020 at 06:00 PM MDT');

    const text = await screen.findByTestId(NOTE_TEST_IDS.TEXT);
    expect(text).toBeVisible();
    expect(text).toHaveTextContent('Lorem enim tempor ex nulla amet ullamco.');
  });

  test('should render featured note correctly', async () => {
    const { openMoreMenu, clickMenuItem } = setup({ featured: true });

    const featuredNoteChip = screen.getByTestId(
      NOTE_TEST_IDS.FEATURED_NOTE_CHIP
    );
    expect(featuredNoteChip).toBeVisible();
    expect(featuredNoteChip).toHaveTextContent('Featured Note');

    await openMoreMenu();

    await clickMenuItem(
      NOTE_TEST_IDS.TOGGLE_FEATURED_MENU_ITEM,
      'Unfeature Note'
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });

  test('should not call feature fn if the property is undefined', async () => {
    const mockOnToggleFeatured = jest.fn();
    const { openMoreMenu, clickMenuItem } = setup({
      featured: true,
      onToggleFeatured: mockOnToggleFeatured,
    });

    const featuredNoteChip = screen.getByTestId(
      NOTE_TEST_IDS.FEATURED_NOTE_CHIP
    );
    expect(featuredNoteChip).toBeVisible();
    expect(featuredNoteChip).toHaveTextContent('Featured Note');

    await openMoreMenu();
    await clickMenuItem(
      NOTE_TEST_IDS.TOGGLE_FEATURED_MENU_ITEM,
      'Unfeature Note'
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockOnToggleFeatured).toBeCalled();
    });
  });

  test('should show alert on delete menu item click', async () => {
    const mockOnDelete = jest.fn();

    const { openMoreMenu, clickMenuItem } = setup({
      onDelete: mockOnDelete,
    });

    await openMoreMenu();
    await clickMenuItem(NOTE_TEST_IDS.DELETE_MENU_ITEM, 'Delete');

    expect(mockOnDelete).not.toBeCalled();

    const deletedAlert = await screen.findByTestId(NOTE_TEST_IDS.DELETED_ALERT);
    expect(deletedAlert).toBeVisible();
    expect(deletedAlert).toHaveTextContent('Note deleted');

    act(() => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(mockOnDelete).toBeCalled();
    });
  });

  test('should hide alert on undo button click and reappear on delete menu item click', async () => {
    const mockOnDelete = jest.fn();

    const { user, openMoreMenu, clickMenuItem } = setup({
      onDelete: mockOnDelete,
    });

    await openMoreMenu();
    await clickMenuItem(NOTE_TEST_IDS.DELETE_MENU_ITEM, 'Delete');

    const undoDeleteButton = await screen.findByTestId(
      NOTE_TEST_IDS.UNDO_DELETE_BUTTON
    );
    expect(undoDeleteButton).toBeVisible();
    expect(undoDeleteButton).toHaveTextContent('Undo');
    expect(undoDeleteButton).toBeEnabled();

    await user.click(undoDeleteButton);

    const firstDeletedAlert = screen.queryByTestId(NOTE_TEST_IDS.DELETED_ALERT);
    expect(firstDeletedAlert).not.toBeInTheDocument();

    expect(mockOnDelete).not.toBeCalled();

    await openMoreMenu();
    await clickMenuItem(NOTE_TEST_IDS.DELETE_MENU_ITEM, 'Delete');

    const reappearedDeletedAlert = await screen.findByTestId(
      NOTE_TEST_IDS.DELETED_ALERT
    );
    expect(reappearedDeletedAlert).toBeVisible();
  });
});

test('should render note correctly with wrapper', () => {
  const wrapperTestId = 'wrapper-test-id';
  setup({
    textWrapper: ({ children }) => (
      <div data-testid={wrapperTestId}>{children}</div>
    ),
  });

  const wrapper = screen.getByTestId(wrapperTestId);
  expect(wrapper).toBeVisible();
  expect(wrapper).toHaveTextContent(mockDefaultProps.text);
});

test('should hide edit mode on "Save" edit button click', async () => {
  const { user, openMoreMenu, clickMenuItem } = setup();

  await openMoreMenu();
  await clickMenuItem(NOTE_TEST_IDS.EDIT_MENU_ITEM, 'Edit');

  const editInput = await screen.findByTestId(NOTE_TEST_IDS.EDIT_INPUT);
  expect(editInput).toBeVisible();
  expect(editInput).toHaveTextContent(
    'Lorem enim tempor ex nulla amet ullamco.'
  );
  await user.type(editInput, 'Edited');
  await waitFor(() => {
    expect(editInput).toHaveValue(
      'Lorem enim tempor ex nulla amet ullamco.Edited'
    );
  });
  const editSaveChangesButton = await screen.findByTestId(
    NOTE_TEST_IDS.EDIT_SAVE_CHANGES_BUTTON
  );
  expect(editSaveChangesButton).toBeVisible();
  expect(editSaveChangesButton).toBeEnabled();
  await user.click(editSaveChangesButton);
  await waitFor(() => {
    expect(editInput).not.toBeVisible();
  });
  await waitFor(() => {
    expect(editSaveChangesButton).not.toBeVisible();
  });
});

describe('getInitials', () => {
  test('should return empty if no first name', () => {
    const actualResult = getInitials();
    expect(actualResult).toBe('');
  });

  test('should return last name initial if no first name', () => {
    const actualResult = getInitials('', 'Dow');
    expect(actualResult).toBe('D');
  });

  test('should return first name initial if no last name', () => {
    const actualResult = getInitials('John');
    expect(actualResult).toBe('J');
  });

  test('should return upper case initials based on first name and last name', () => {
    const actualResult = getInitials('john', 'dow');
    expect(actualResult).toBe('JD');
  });
});

describe('getUpdatedAtLabel', () => {
  test('should return null if batch date is empty', () => {
    const actualResult = getUpdatedAtLabel();
    expect(actualResult).toBeNull();
  });

  test('should return null if date is invalid', () => {
    const actualResult = getUpdatedAtLabel('test');
    expect(actualResult).toBeNull();
  });

  test('should return date formatted to locale', () => {
    const actualResult = getUpdatedAtLabel('2020-07-08T00:00:00.305Z');
    expect(actualResult).toBe('7/7/2020 at 06:00 PM MDT');
  });
});

describe('getSecondaryLabel', () => {
  test('should return date without delimiters if isEdited is falsy', () => {
    const updatedAtLabel = '7/7/2020 at 06:00 PM MDT';
    const actualResult = getSecondaryLabel({
      updatedAtLabel,
      isEdited: false,
    });
    expect(actualResult).toBe(updatedAtLabel);
  });

  test('should return Edited label without delimiters if updatedAtLabel is empty and isEdited is truthy', () => {
    const actualResult = getSecondaryLabel({
      isEdited: true,
      updatedAtLabel: null,
    });
    expect(actualResult).toBe('Edited');
  });

  test('should return Edited label and date with delimiters if props are passed', () => {
    const updatedAtLabel = '7/7/2020 at 06:00 PM MDT';
    const actualResult = getSecondaryLabel({
      isEdited: true,
      updatedAtLabel,
    });
    expect(actualResult).toBe(`Edited • ${updatedAtLabel}`);
  });

  test('should return tag without delimiters if isEdited and updatedAtLabel props are empty', () => {
    const tag = 'General Note';
    const actualResult = getSecondaryLabel({
      tag,
      isEdited: false,
      updatedAtLabel: null,
    });
    expect(actualResult).toBe(tag);
  });

  test('should return tag, date, and Edited label with delimiters if props are passed', () => {
    const updatedAtLabel = '7/7/2020 at 06:00 PM MDT';
    const tag = 'General Note';
    const actualResult = getSecondaryLabel({
      tag,
      isEdited: true,
      updatedAtLabel,
    });
    expect(actualResult).toBe(`Edited • ${updatedAtLabel} • ${tag}`);
  });
});
