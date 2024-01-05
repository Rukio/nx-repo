import { render, screen, userEvent } from '../../../../test-utils';
import Notes, { NotesProps } from '..';
import Note from '../../Note';
import { NOTES_TEST_IDS } from '../testIds';
import { NOTE_TEST_IDS } from '../../Note/testIds';

const mockOnPostNote = jest.fn();

const mockDefaultProps: NotesProps = {
  onSubmit: mockOnPostNote,
};

const setup = (props: Partial<NotesProps> = {}) => ({
  ...render(<Notes {...mockDefaultProps} {...props} />),
  user: userEvent.setup(),
});

describe('Notes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('snapshots', () => {
    test('should render empty notes component', () => {
      const { asFragment } = setup();
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render empty notes component with padding', () => {
      const { asFragment } = setup({ withPadding: true });
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render notes with note list', () => {
      const { asFragment } = setup({
        children: (
          <Note
            id={1}
            displayDate={'2020-07-08T00:00:00.305Z'}
            firstName="John"
            lastName="Dow"
            jobTitle="RN"
            text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
          />
        ),
      });
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render notes with note list without dispayDate', () => {
      const { asFragment } = setup({
        children: (
          <Note
            id={1}
            firstName="John"
            lastName="Dow"
            jobTitle="RN"
            text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
          />
        ),
      });
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render notes with note list without firstName and lastName', () => {
      const { asFragment } = setup({
        children: (
          <Note
            id={1}
            displayDate={'2020-07-08T00:00:00.305Z'}
            jobTitle="RN"
            text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
          />
        ),
      });
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render notes with note list without jobTitle', () => {
      const { asFragment } = setup({
        children: (
          <Note
            id={1}
            displayDate={'2020-07-08T00:00:00.305Z'}
            firstName="John"
            lastName="Dow"
            text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
          />
        ),
      });
      expect(asFragment()).toMatchSnapshot();
    });

    test('should render notes with note list without any user info data', () => {
      const { asFragment } = setup({
        children: (
          <Note
            id={1}
            text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
          />
        ),
      });
      expect(asFragment()).toMatchSnapshot();
    });
  });

  test('should show empty list if no notes provided', () => {
    setup();

    const emptyMessage = screen.getByTestId(NOTES_TEST_IDS.EMPTY_MESSAGE);
    expect(emptyMessage).toBeVisible();
    expect(emptyMessage).toHaveTextContent('No notes have been added');

    const listLabel = screen.queryByTestId(NOTES_TEST_IDS.LIST_LABEL);
    expect(listLabel).not.toBeInTheDocument();

    const list = screen.queryByTestId(NOTES_TEST_IDS.LIST);
    expect(list).not.toBeInTheDocument();
  });

  test('should show notes list if notes were provided', () => {
    const listLabelText = 'Notes label';
    const noteId = 1;
    setup({
      children: (
        <Note
          id={noteId}
          displayDate={'2020-07-08T00:00:00.305Z'}
          firstName="John"
          lastName="Dow"
          jobTitle="RN"
          text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel mauris eleifend, cursus metus sit amet, tincidunt diam. Donec et orci ex."
        />
      ),
      listLabel: listLabelText,
    });

    const emptyMessage = screen.queryByTestId(NOTES_TEST_IDS.EMPTY_MESSAGE);
    expect(emptyMessage).not.toBeInTheDocument();

    const listLabel = screen.getByTestId(NOTES_TEST_IDS.LIST_LABEL);
    expect(listLabel).toBeVisible();
    expect(listLabel).toHaveTextContent(listLabelText);

    const list = screen.getByTestId(NOTES_TEST_IDS.LIST);
    expect(list).toBeVisible();

    const note = screen.getByTestId(NOTE_TEST_IDS.getNoteByTestId(noteId));
    expect(note).toBeVisible();
  });
});
