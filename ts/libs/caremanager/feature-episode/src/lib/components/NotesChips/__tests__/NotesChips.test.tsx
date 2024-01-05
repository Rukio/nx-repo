import { fireEvent, screen } from '@testing-library/react';
import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import NotesChips from '../NotesChips';
import { NoteKind } from '@*company-data-covered*/caremanager/data-access-types';

const setup = (
  currentNoteKind: NoteKind = NoteKind.DailyUpdate,
  setCurrentNoteKind: (noteType: NoteKind) => void = () => {
    // noop
  }
) => {
  renderWithClient(
    <NotesChips
      currentNoteKind={currentNoteKind}
      setCurrentNoteKind={setCurrentNoteKind}
    />
  );
};

describe('NotesChips', () => {
  it('renders all the note kinds', () => {
    setup();

    expect(screen.getByTestId('create-note-general-chip')).toBeInTheDocument();
    expect(
      screen.getByTestId('create-note-daily-update-chip')
    ).toBeInTheDocument();
    expect(screen.getByTestId('create-note-clinical-chip')).toBeInTheDocument();
    expect(
      screen.getByTestId('create-note-navigator-chip')
    ).toBeInTheDocument();
  });

  it('current note kind/tag is selected', () => {
    setup();

    const chip = screen.getByTestId('create-note-daily-update-chip');
    expect(chip).toBeInTheDocument();
    expect(chip.className).toContain('filled');
    expect(
      screen.getByTestId('create-note-general-chip').className
    ).not.toContain('filled');
    expect(
      screen.getByTestId('create-note-clinical-chip').className
    ).not.toContain('filled');
    expect(
      screen.getByTestId('create-note-navigator-chip').className
    ).not.toContain('filled');
  });

  it('click Handler is called', () => {
    const handler = vi.fn();
    setup(NoteKind.DailyUpdate, handler);

    const chip = screen.getByTestId('create-note-clinical-chip');
    fireEvent.click(chip);
    expect(handler).toHaveBeenCalled();
  });
});
