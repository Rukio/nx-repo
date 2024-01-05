import { el } from '@*company-data-covered*/cypress-shared';
import {
  SNACKBAR_MESSAGES,
  formattedDateWithTime,
  getAvatarInitials,
} from '@*company-data-covered*/caremanager/utils';
import { Note, NoteKind } from '@*company-data-covered*/caremanager/data-access-types';
import {
  EpisodeNotesTab,
  SNACKBAR,
  getCreateNoteChip,
  getNoteListItemDetails,
  getNoteListItemEditButton,
  getNoteListItemMenuButton,
  getNoteListItemOverview,
  getNoteMoreButton,
  getNoteOverviewAvatar,
  getNoteOverviewSubtitleLabel,
  interceptDELETEDailyUpdate,
  interceptDELETENote,
  interceptGETConfigData,
  interceptGETDeletedNotes,
  interceptGETEpisodeWithPinnedNotes,
  interceptGETUpdatedNote,
  interceptGETUpdatedNotes,
  interceptGETUsers,
  interceptPATCHNote,
  interceptPATCHPinNote,
  interceptPATCHUnpinNote,
  interceptPOSTNote,
  isSnackbarVisible,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';

const {
  EPISODE_NOTE_COMPOSE_HEADER,
  CREATE_NOTE_TAGS_HEADER,
  CREATE_NOTE_GENERAL_CHIP,
  CREATE_NOTE_DAILY_UPDATE_CHIP,
  CREATE_NOTE_CLINICAL_CHIP,
  CREATE_NOTE_NAVIGATOR_CHIP,
  CREATE_NOTE_DISCARD_BUTTON,
  CREATE_NOTE_TEXT_FIELD,
  CREATE_NOTE_POST_BUTTON,
  NOTE_OVERVIEW_EDIT_INPUT,
  NOTE_OVERVIEW_EDIT_SAVE_BUTTON,
  EPISODE_NOTE_LIST_SELECT,
  DEFAULT_SNACKBAR_ERROR_MESSAGE,
  EDIT_MENU_ITEM,
  DELETE_MENU_ITEM,
} = EpisodeNotesTab;

const NOTE_TYPES = [
  {
    kind: NoteKind.General,
    labelText: 'General Notes',
    chipText: 'General Notes',
    episodeDetailsIndex: 2,
  },
  {
    kind: NoteKind.DailyUpdate,
    labelText: 'Daily Updates',
    chipText: 'Daily Updates',
    episodeDetailsIndex: 1,
  },
  {
    kind: NoteKind.Clinical,
    labelText: 'Clinical Notes',
    chipText: 'Clinical Notes',
    episodeDetailsIndex: 3,
  },
  {
    kind: NoteKind.Navigator,
    labelText: 'Navigator Notes',
    chipText: 'Navigator Notes',
    episodeDetailsIndex: 4,
  },
];

const NotesFilters = [
  NoteKind.DailyUpdate,
  NoteKind.General,
  NoteKind.Clinical,
  NoteKind.Navigator,
  'All',
];

type NoteTypes = 'daily_update' | 'clinical' | 'general' | 'navigator';
type NoteTypesFilters = NoteTypes | 'All';

const NOTE_TYPES_TEXTS = {
  [NoteKind.DailyUpdate]: 'Daily Updates',
  [NoteKind.Clinical]: 'Clinical Notes',
  [NoteKind.General]: 'General Notes',
  [NoteKind.Navigator]: 'Navigator Notes',
  All: 'All Notes',
};

const verifyNotesFilters = () => {
  NotesFilters.forEach((filter) => {
    el(EpisodeNotesTab.EPISODE_NOTE_LIST_SELECT).click();
    el(getFilterOption(filter.toLocaleLowerCase().replace('_', '-'))).click();
    el(EpisodeNotesTab.EPISODE_NOTE_LIST_SELECT).hasText(
      NOTE_TYPES_TEXTS[filter as NoteTypesFilters]
    );
  });
};

const verifyNoteSubtitle = (
  formattedDateStringArray: string[],
  id: string,
  note_kind: string
) => {
  el(getNoteOverviewSubtitleLabel(id, 'date')).hasText(
    `${formattedDateStringArray[0].trim()} at `
  );
  el(getNoteOverviewSubtitleLabel(id, 'time')).hasText(
    `${formattedDateStringArray[1].trim()} · `
  );
  el(getNoteOverviewSubtitleLabel(id, 'kind')).hasText(
    `${NOTE_TYPES_TEXTS[note_kind as NoteTypes]}`
  );
};

const verifyNotes = (notes: Note[]) => {
  notes.forEach((note) => {
    const { id, details, updatedAt, createdAt, noteKind } = note;

    el(getNoteListItemDetails(id)).hasText(details);

    const dateToShow = updatedAt || createdAt || new Date();
    const formattedDateStringArray = formattedDateWithTime(
      new Date(dateToShow)
    ).split('at');
    verifyNoteSubtitle(formattedDateStringArray, id, noteKind);
    cy.fixture('apiResp/users').then(({ users }) => {
      el(getNoteOverviewAvatar(id)).hasText(
        getAvatarInitials(users[0].first_name, users[0].last_name)
      );
    });
  });
};

const filterNotesByType = (notes: Note[], type: NoteKind) =>
  notes.filter((note) => note.noteKind === type);

const getFilterOption = (kind: string) => `episode-notes-list-${kind}-option`;

const changeNoteFilter = (filter: NoteTypesFilters) => {
  el(EpisodeNotesTab.EPISODE_NOTE_LIST_SELECT).click();
  el(getFilterOption(filter.toLocaleLowerCase().replace('_', '-'))).click();
};

describe('Notes Tabs', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETConfigData();
    interceptGETUsers();
    navigateCareManagerTo({ location: 'EPISODE_DETAILS_NOTES_TAB' });
  });

  describe('Initial State - Notes Tabs', () => {
    it('should display correct notes information', () => {
      cy.fixture('apiResp/episodeDetails').then(({ episode: { notes } }) => {
        el(EPISODE_NOTE_COMPOSE_HEADER).hasText('Compose');
        el(CREATE_NOTE_GENERAL_CHIP).should('not.exist');
        el(CREATE_NOTE_DAILY_UPDATE_CHIP).should('not.exist');
        el(CREATE_NOTE_CLINICAL_CHIP).should('not.exist');
        el(CREATE_NOTE_NAVIGATOR_CHIP).should('not.exist');
        el(CREATE_NOTE_DISCARD_BUTTON).should('not.exist');
        el(CREATE_NOTE_POST_BUTTON).should('not.exist');
        el(CREATE_NOTE_TEXT_FIELD)
          .find('textarea')
          .hasPlaceholder('Add a note for the team');
        el(CREATE_NOTE_TEXT_FIELD).click();
        el(CREATE_NOTE_TAGS_HEADER).hasText('Tags');
        el(CREATE_NOTE_GENERAL_CHIP).hasText('General Notes');
        el(CREATE_NOTE_DAILY_UPDATE_CHIP).hasText('Daily Updates');
        el(CREATE_NOTE_CLINICAL_CHIP).hasText('Clinical Notes');
        el(CREATE_NOTE_NAVIGATOR_CHIP).hasText('Navigator Notes');
        el(CREATE_NOTE_DISCARD_BUTTON).hasText('Discard');
        el(CREATE_NOTE_POST_BUTTON).hasText('Post');

        el(EPISODE_NOTE_LIST_SELECT).isVisible();
        verifyNotesFilters();
        changeNoteFilter('All');

        notes.forEach((note: never) => {
          const { id, details, updated_at, created_at, note_kind } = note;

          el(getNoteListItemDetails(id)).hasText(details);
          const dateToShow = updated_at || created_at;
          const formatedDateStringArray = formattedDateWithTime(
            new Date(dateToShow)
          ).split('at');
          verifyNoteSubtitle(formatedDateStringArray, id, note_kind);

          // eslint-disable-next-line promise/no-nesting
          cy.fixture('apiResp/users').then(({ users }) => {
            el(getNoteOverviewAvatar(id)).hasText(
              getAvatarInitials(users[0].first_name, users[0].last_name)
            );
          });
        });
      });
    });

    it('should pin a note', () => {
      cy.fixture('apiResp/episodeDetails').then(({ episode: { notes } }) => {
        const thirdNote = notes[2];
        el(getNoteOverviewSubtitleLabel(thirdNote.id, 'pin')).should(
          'not.exist'
        );

        interceptPATCHPinNote();
        interceptGETEpisodeWithPinnedNotes({ noteIndex: 2 });
        el(getNoteListItemMenuButton(thirdNote.id)).click({
          force: true,
        });
        el(getNoteListItemEditButton('pin')).click();

        el(getNoteOverviewSubtitleLabel(thirdNote.id, 'pin')).isVisible();
        el(getNoteListItemMenuButton(thirdNote.id)).click({
          force: true,
        });
        isSnackbarVisible(SNACKBAR_MESSAGES.PINNED_NOTE);
        el(getNoteListItemEditButton('unpin')).isVisible();

        const fourthNote = notes[3];
        el(getNoteListItemMenuButton(fourthNote.id)).click({
          force: true,
        });
        el(getNoteListItemEditButton('pin')).should('not.exist');
      });
    });

    it('should unpin a note', () => {
      cy.fixture('apiResp/episodeDetails').then(({ episode: { notes } }) => {
        const firstNote = notes[0];
        el(getNoteOverviewSubtitleLabel(firstNote.id, 'pin')).isVisible();
        interceptPATCHUnpinNote();
        interceptGETEpisodeWithPinnedNotes({ pinValue: false });
        el(getNoteListItemMenuButton(firstNote.id)).click({
          force: true,
        });
        el(getNoteListItemEditButton('unpin')).click();

        el(getNoteOverviewSubtitleLabel(firstNote.id, 'pin')).should(
          'not.exist'
        );
        isSnackbarVisible(SNACKBAR_MESSAGES.UNPINNED_NOTE);
      });
    });

    NOTE_TYPES.forEach((type) => {
      const { kind, labelText } = type;
      it(`should filter ${labelText.toLowerCase()} team notes`, () => {
        cy.fixture('apiResp/episodeDetails').then(({ episode: { notes } }) => {
          const filteredNotes = filterNotesByType(notes, kind);
          changeNoteFilter(kind);
          verifyNotes(filteredNotes);
        });
      });
    });

    describe('Notes Tabs', () => {
      it('should add a new note', () => {
        el(CREATE_NOTE_TEXT_FIELD).type('For the horde');
        interceptPOSTNote({ noteKind: NoteKind.DailyUpdate });
        el(CREATE_NOTE_POST_BUTTON).click();
        isSnackbarVisible(SNACKBAR_MESSAGES.CREATED_NOTE);
      });

      NOTE_TYPES.forEach((type) => {
        const { labelText, chipText, kind } = type;
        it(`should add a new ${labelText.toLowerCase()} team note`, () => {
          cy.fixture('apiResp/episodeNotesPost').then(
            ({ note: { id, details, note_kind } }) => {
              const note = `This is a new ${note_kind} Note`;
              el(CREATE_NOTE_TEXT_FIELD)
                .find('textarea')
                .eq(1)
                .clear({ force: true });
              el(CREATE_NOTE_TEXT_FIELD).type(note);
              el(
                getCreateNoteChip(
                  note_kind.toLocaleLowerCase().replace(' ', '-')
                )
              ).click();
              interceptPOSTNote({ noteKind: kind });
              interceptGETUpdatedNote({
                noteKind: kind,
                kindText: chipText,
              });
              el(CREATE_NOTE_POST_BUTTON).click({ force: true });
              isSnackbarVisible(SNACKBAR_MESSAGES.CREATED_NOTE);
              el(`note-overview-details-${id}`).hasText(
                `${details.trim()} ${chipText.trim()} Note`
              );
            }
          );
        });
      });

      Cypress.on('uncaught:exception', () => false);
      it('should fail to add a new note', () => {
        interceptPOSTNote({
          noteKind: NoteKind.General,
          statusCode: 422,
        });
        el(CREATE_NOTE_TEXT_FIELD).type('For the horde');
        el(CREATE_NOTE_POST_BUTTON).click();
        isSnackbarVisible(DEFAULT_SNACKBAR_ERROR_MESSAGE);
      });

      NOTE_TYPES.forEach((type) => {
        const { labelText, episodeDetailsIndex, kind } = type;
        it(`should edit a new ${labelText.toLowerCase()} team note`, () => {
          cy.fixture('apiResp/episodeDetailsNotesUpdate').then(
            ({ episode: { notes } }) => {
              const noteId = notes[episodeDetailsIndex].id;
              changeNoteFilter(kind);
              el(getNoteListItemMenuButton(noteId)).click();
              el(getNoteListItemEditButton('edit')).click();

              const updatedNote = `This is the new updated ${labelText} Note`;
              el(NOTE_OVERVIEW_EDIT_INPUT)
                .find('textarea')
                .eq(1)
                .clear({ force: true });
              el(NOTE_OVERVIEW_EDIT_INPUT).type(updatedNote);
              interceptPATCHNote({ noteKind: kind, noteId });
              interceptGETUpdatedNotes({
                noteKind: kind,
                kindText: labelText,
                arrayIndex: episodeDetailsIndex,
              });

              el(NOTE_OVERVIEW_EDIT_SAVE_BUTTON).click();
              isSnackbarVisible(SNACKBAR_MESSAGES.EDITED_NOTE);
              el(getNoteListItemDetails(noteId)).hasText(updatedNote);
            }
          );
        });
      });

      it('should fail to edit a note', () => {
        interceptPATCHNote({ statusCode: 422 });
        cy.fixture('apiResp/episodeNotesPatch').then(({ note: { id } }) => {
          el(getNoteMoreButton(id)).click();
          el(EDIT_MENU_ITEM).click();
          el(NOTE_OVERVIEW_EDIT_INPUT).type('For the horde');
          el(NOTE_OVERVIEW_EDIT_SAVE_BUTTON).click();
          isSnackbarVisible(DEFAULT_SNACKBAR_ERROR_MESSAGE);
        });
      });

      NOTE_TYPES.forEach((type) => {
        const { labelText, kind, episodeDetailsIndex } = type;
        it(`should delete a ${labelText.toLowerCase()} team note`, () => {
          cy.fixture('apiResp/episodeDetailsNotesUpdate').then(
            ({ episode: { notes } }) => {
              const noteId = notes[episodeDetailsIndex].id;
              const noteOverviewId = getNoteListItemOverview(noteId);

              el(noteOverviewId).isVisible();
              interceptDELETENote({ noteKind: kind });
              interceptGETDeletedNotes({
                arrayIndex: episodeDetailsIndex,
              });

              el(getNoteListItemMenuButton(noteId)).click();
              el(getNoteListItemEditButton('delete')).click();

              el(noteOverviewId).should('not.exist');
            }
          );
        });
      });

      it('should fail to delete a note', () => {
        interceptDELETEDailyUpdate({ statusCode: 422 });
        cy.fixture('apiResp/episodeNotesPatch')
          .then(({ note: { id } }) => {
            el(getNoteMoreButton(id)).click();
            el(DELETE_MENU_ITEM).click();

            return cy.wait('@interceptDELETEDailyUpdate');
          })
          .then(() => cy.get(SNACKBAR).isVisible());
      });
    });
  });
});
