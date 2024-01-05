import { render, userEvent, screen, waitFor } from '../../../../../test-utils';
import { NOTE_TEST_IDS } from '../../testIds';
import MoreMenu, { MoreMenuProps } from './MoreMenu';

const mockDefaultProps: MoreMenuProps = {
  onFeaturedClick: jest.fn(),
  onEditClick: jest.fn(),
  onDeleteClick: jest.fn(),
};

const setup = (props: Partial<MoreMenuProps> = {}) => ({
  ...render(<MoreMenu {...mockDefaultProps} {...props} />),
  user: userEvent.setup(),
});

describe('MoreMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render with closed menu correctly', async () => {
    const { asFragment } = setup();
    expect(asFragment()).toMatchSnapshot();
  });

  test('should call onToggleFeatured on menu item click if note is not featured', async () => {
    const { user } = setup();

    const moreButton = await screen.findByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).toBeVisible();
    expect(moreButton).toBeEnabled();

    await user.click(moreButton);

    const toggleFeaturedMenuItem = await screen.findByTestId(
      NOTE_TEST_IDS.TOGGLE_FEATURED_MENU_ITEM
    );
    expect(toggleFeaturedMenuItem).toBeVisible();
    expect(toggleFeaturedMenuItem).toBeEnabled();
    expect(toggleFeaturedMenuItem).toHaveTextContent('Make Featured Note');

    await user.click(toggleFeaturedMenuItem);

    await waitFor(() => {
      expect(toggleFeaturedMenuItem).not.toBeVisible();
    });

    await waitFor(() => {
      expect(mockDefaultProps.onFeaturedClick).toBeCalled();
    });
  });

  test('should call onToggleFeatured on menu item click if note is featured', async () => {
    const { user } = setup({ featured: true });

    const moreButton = screen.getByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).toBeVisible();
    expect(moreButton).toBeEnabled();

    await user.click(moreButton);

    const toggleFeaturedMenuItem = await screen.findByTestId(
      NOTE_TEST_IDS.TOGGLE_FEATURED_MENU_ITEM
    );
    expect(toggleFeaturedMenuItem).toBeVisible();
    expect(toggleFeaturedMenuItem).toBeEnabled();
    expect(toggleFeaturedMenuItem).toHaveTextContent('Unfeature Note');

    await user.click(toggleFeaturedMenuItem);

    await waitFor(() => {
      expect(mockDefaultProps.onFeaturedClick).toBeCalled();
    });
  });

  test('should not show "Make featured" option if isFeaturedNoteEnabled is falsy', async () => {
    const { user } = setup({ isFeaturedNoteEnabled: false });

    const moreButton = await screen.findByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).toBeVisible();
    expect(moreButton).toBeEnabled();

    await user.click(moreButton);

    const toggleFeaturedMenuItem = screen.queryByTestId(
      NOTE_TEST_IDS.TOGGLE_FEATURED_MENU_ITEM
    );
    expect(toggleFeaturedMenuItem).not.toBeInTheDocument();
  });

  test('should not show "Edit" option if isEditingEnabled is falsy', async () => {
    const { user } = setup({ isEditingEnabled: false });

    const moreButton = await screen.findByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).toBeVisible();
    expect(moreButton).toBeEnabled();

    await user.click(moreButton);

    const editMenuItem = screen.queryByTestId(NOTE_TEST_IDS.EDIT_MENU_ITEM);
    expect(editMenuItem).not.toBeInTheDocument();
  });

  test('should call onEditClick on menu item click', async () => {
    const { user } = setup();

    const moreButton = await screen.findByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).toBeVisible();
    expect(moreButton).toBeEnabled();

    await user.click(moreButton);

    const editMenuItem = await screen.findByTestId(
      NOTE_TEST_IDS.EDIT_MENU_ITEM
    );
    expect(editMenuItem).toBeVisible();
    expect(editMenuItem).toBeEnabled();

    await user.click(editMenuItem);

    await waitFor(() => {
      expect(mockDefaultProps.onEditClick).toBeCalled();
    });
  });

  test('should not show "Delete" option if isDeletingEnabled is falsy', async () => {
    const { user } = setup({ isDeletingEnabled: false });

    const moreButton = await screen.findByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).toBeVisible();
    expect(moreButton).toBeEnabled();

    await user.click(moreButton);

    const deleteMenuItem = screen.queryByTestId(NOTE_TEST_IDS.DELETE_MENU_ITEM);
    expect(deleteMenuItem).not.toBeInTheDocument();
  });

  test('should call onDeleteClick on menu item click', async () => {
    const { user } = setup();

    const moreButton = await screen.findByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).toBeVisible();
    expect(moreButton).toBeEnabled();

    await user.click(moreButton);

    const deleteMenuItem = await screen.findByTestId(
      NOTE_TEST_IDS.DELETE_MENU_ITEM
    );
    expect(deleteMenuItem).toBeVisible();
    expect(deleteMenuItem).toBeEnabled();

    await user.click(deleteMenuItem);

    await waitFor(() => {
      expect(mockDefaultProps.onDeleteClick).toBeCalled();
    });
  });

  test('should not show more button if isDeletingEnabled, isEditingEnabled, isFeaturedNoteEnabled options are falsy', () => {
    setup({
      isDeletingEnabled: false,
      isEditingEnabled: false,
      isFeaturedNoteEnabled: false,
    });

    const moreButton = screen.queryByTestId(NOTE_TEST_IDS.MORE_BUTTON);
    expect(moreButton).not.toBeInTheDocument();
  });
});
