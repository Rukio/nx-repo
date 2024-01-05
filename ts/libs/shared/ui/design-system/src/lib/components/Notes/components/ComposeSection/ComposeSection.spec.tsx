import { render, userEvent, screen, waitFor } from '../../../../../test-utils';
import { NOTES_TEST_IDS } from '../../testIds';
import ComposeSection, {
  ComposeSectionProps,
  DEFAULT_TAGS,
} from './ComposeSection';

const mockDefaultProps: ComposeSectionProps = {
  maxRows: 1,
  multiline: true,
  onSubmit: jest.fn(),
};

const setup = (props?: Partial<ComposeSectionProps>) => ({
  ...render(<ComposeSection {...mockDefaultProps} {...props} />),
  user: userEvent.setup(),
});

describe('ComposeSection', () => {
  test('should show compose controls on input focus and hide on blur', async () => {
    const { user } = setup();

    let notesComposeDiscardButton = screen.queryByTestId(
      NOTES_TEST_IDS.COMPOSE_DISCARD_BUTTON
    );
    let notesComposePostButton = screen.queryByTestId(
      NOTES_TEST_IDS.COMPOSE_POST_BUTTON
    );
    expect(notesComposeDiscardButton).not.toBeInTheDocument();
    expect(notesComposePostButton).not.toBeInTheDocument();

    const notesComposeInput = screen.getByTestId(NOTES_TEST_IDS.COMPOSE_INPUT);
    await user.click(notesComposeInput);

    notesComposeDiscardButton = await screen.findByTestId(
      NOTES_TEST_IDS.COMPOSE_DISCARD_BUTTON
    );
    notesComposePostButton = await screen.findByTestId(
      NOTES_TEST_IDS.COMPOSE_POST_BUTTON
    );

    expect(notesComposeDiscardButton).toBeVisible();
    expect(notesComposeDiscardButton).toHaveTextContent('Discard');
    expect(notesComposePostButton).toBeVisible();
    expect(notesComposePostButton).toHaveTextContent('Post');

    await user.click(document.body);

    notesComposeDiscardButton = screen.queryByTestId(
      NOTES_TEST_IDS.COMPOSE_DISCARD_BUTTON
    );
    notesComposePostButton = screen.queryByTestId(
      NOTES_TEST_IDS.COMPOSE_POST_BUTTON
    );
    expect(notesComposeDiscardButton).not.toBeInTheDocument();
    expect(notesComposePostButton).not.toBeInTheDocument();
  });

  test('should enable post button and call onPostNote with note on post button click', async () => {
    const mockNoteText = 'Test note';
    const { user } = setup();

    const notesComposeInput = screen.getByTestId(NOTES_TEST_IDS.COMPOSE_INPUT);
    await user.click(notesComposeInput);

    const notesComposePostButton = await screen.findByTestId(
      NOTES_TEST_IDS.COMPOSE_POST_BUTTON
    );
    expect(notesComposePostButton).toBeVisible();
    expect(notesComposePostButton).toBeDisabled();

    await user.type(notesComposeInput, mockNoteText);

    await waitFor(() => {
      expect(notesComposePostButton).toBeEnabled();
    });

    await user.click(notesComposePostButton);

    await waitFor(() => {
      expect(mockDefaultProps.onSubmit).toBeCalledWith({
        text: mockNoteText,
      });
    });

    expect(notesComposeInput).toHaveValue('');
  });

  test('should clear input and reset to first tag on discard button click', async () => {
    const noteText = 'Test note';

    const { user } = setup({ withTags: true });

    const notesComposeInput = screen.getByTestId(NOTES_TEST_IDS.COMPOSE_INPUT);
    await user.click(notesComposeInput);

    const composeDiscardButton = await screen.findByTestId(
      NOTES_TEST_IDS.COMPOSE_DISCARD_BUTTON
    );
    expect(composeDiscardButton).toBeVisible();
    expect(composeDiscardButton).toBeEnabled();

    await user.type(notesComposeInput, noteText);

    await waitFor(() => {
      expect(notesComposeInput).toHaveValue(noteText);
    });

    const firstTag = screen.getByTestId(
      NOTES_TEST_IDS.getTagTestIdByName(DEFAULT_TAGS[0])
    );
    expect(firstTag).toBeVisible();
    expect(firstTag).toHaveAttribute('data-selected', 'true');

    const secondTag = screen.getByTestId(
      NOTES_TEST_IDS.getTagTestIdByName(DEFAULT_TAGS[1])
    );
    expect(secondTag).toBeVisible();
    expect(secondTag).toBeEnabled();
    expect(secondTag).toHaveAttribute('data-selected', 'false');

    await user.click(secondTag);

    await waitFor(() => {
      expect(secondTag).toHaveAttribute('data-selected', 'true');
    });
    expect(firstTag).toHaveAttribute('data-selected', 'false');

    await user.click(composeDiscardButton);

    await waitFor(() => {
      expect(notesComposeInput).toHaveValue('');
    });
    expect(firstTag).toHaveAttribute('data-selected', 'true');
    expect(secondTag).toHaveAttribute('data-selected', 'false');
  });

  test('should show default tags if withTags is truthy and input is focused', async () => {
    const { user } = setup({ withTags: true });

    const notesComposeInput = screen.getByTestId(NOTES_TEST_IDS.COMPOSE_INPUT);
    await user.click(notesComposeInput);

    const tagsWrapper = await screen.findByTestId(NOTES_TEST_IDS.TAGS_WRAPPER);
    expect(tagsWrapper).toBeVisible();

    DEFAULT_TAGS.forEach((tagName) => {
      const tag = screen.getByTestId(
        NOTES_TEST_IDS.getTagTestIdByName(tagName)
      );
      expect(tag).toBeVisible();
      expect(tag).toBeEnabled();
    });
  });

  test('should show custom tags if withTags is truthy and tags list is present and input is focused', async () => {
    const tags = ['TAG1', 'TAG2'];
    const { user } = setup({ withTags: true, tags });

    const notesComposeInput = screen.getByTestId(NOTES_TEST_IDS.COMPOSE_INPUT);
    await user.click(notesComposeInput);

    const tagsWrapper = await screen.findByTestId(NOTES_TEST_IDS.TAGS_WRAPPER);
    expect(tagsWrapper).toBeVisible();

    tags.forEach((tagName) => {
      const tag = screen.getByTestId(
        NOTES_TEST_IDS.getTagTestIdByName(tagName)
      );
      expect(tag).toBeVisible();
      expect(tag).toBeEnabled();
    });
  });

  test('should call onPostNote with note and default tag on post button click', async () => {
    const mockNoteText = 'Test note';
    const { user } = setup({ withTags: true });

    const notesComposeInput = screen.getByTestId(NOTES_TEST_IDS.COMPOSE_INPUT);
    await user.click(notesComposeInput);

    const notesComposePostButton = await screen.findByTestId(
      NOTES_TEST_IDS.COMPOSE_POST_BUTTON
    );
    expect(notesComposePostButton).toBeVisible();
    expect(notesComposePostButton).toBeDisabled();

    await user.type(notesComposeInput, mockNoteText);

    await waitFor(() => {
      expect(notesComposePostButton).toBeEnabled();
    });

    await user.click(notesComposePostButton);

    await waitFor(() => {
      expect(mockDefaultProps.onSubmit).toBeCalledWith({
        text: mockNoteText,
        tag: DEFAULT_TAGS[0],
      });
    });

    expect(notesComposeInput).toHaveValue('');
  });

  test('should call onPostNote with note and selected tag on post button click', async () => {
    const mockNoteText = 'Test note';
    const { user } = setup({ withTags: true });

    const notesComposeInput = screen.getByTestId(NOTES_TEST_IDS.COMPOSE_INPUT);
    await user.click(notesComposeInput);

    const notesComposePostButton = await screen.findByTestId(
      NOTES_TEST_IDS.COMPOSE_POST_BUTTON
    );
    expect(notesComposePostButton).toBeVisible();
    expect(notesComposePostButton).toBeDisabled();

    await user.type(notesComposeInput, mockNoteText);

    await waitFor(() => {
      expect(notesComposePostButton).toBeEnabled();
    });

    const tag = screen.getByTestId(
      NOTES_TEST_IDS.getTagTestIdByName(DEFAULT_TAGS[1])
    );
    expect(tag).toBeVisible();
    expect(tag).toBeEnabled();

    await user.click(tag);

    await user.click(notesComposePostButton);

    await waitFor(() => {
      expect(mockDefaultProps.onSubmit).toBeCalledWith({
        text: mockNoteText,
        tag: DEFAULT_TAGS[1],
      });
    });

    expect(notesComposeInput).toHaveValue('');
  });
});
