import { el } from '@*company-data-covered*/cypress-shared';
import { SNACKBAR_MESSAGES } from '@*company-data-covered*/caremanager/utils';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { NoteKind } from '@*company-data-covered*/caremanager/data-access-types';
import {
  EpisodeNotesTab,
  TEST_CARE_MANAGER_ID,
  getCreateNoteChip,
  getNoteListItemEditButton,
  getNoteListItemMenuButton,
  getNoteListItemOverview,
  getNoteOverview,
  interceptGETEpisodeDetails,
  interceptPATCHNote,
  interceptPOSTNote,
  isSnackbarVisible,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';

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

describe('Episode details notes tab', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.deleteEpisodeNotes(TEST_CARE_MANAGER_ID);
  });

  describe('Note Creation', () => {
    beforeEach(() => {
      interceptPOSTNote({ mockResp: false });
      navigateCareManagerTo({
        location: 'EPISODE_DETAILS_NOTES_TAB',
        mockResp: false,
      });
    });

    NOTE_TYPES.forEach((type) => {
      const { labelText, kind } = type;
      it(`should add a new ${labelText.toLowerCase()} team note`, () => {
        const newNote = `This is a new ${labelText} Note`;

        el(EpisodeNotesTab.CREATE_NOTE_TEXT_FIELD)
          .find('textarea')
          .eq(1)
          .clear({ force: true });
        el(EpisodeNotesTab.CREATE_NOTE_TEXT_FIELD).type(newNote);
        el(
          getCreateNoteChip(kind.toLocaleLowerCase().replace('_', '-'))
        ).click();
        el(EpisodeNotesTab.CREATE_NOTE_POST_BUTTON).click();

        cy.wait('@interceptPOSTNote').then((note) => {
          isSnackbarVisible(SNACKBAR_MESSAGES.CREATED_NOTE);
          el(getNoteOverview(note?.response?.body.note.id)).hasText(newNote);
        });
      });
    });
  });

  describe('Existing Notes', () => {
    describe('Delete Note', () => {
      beforeEach(() => {
        navigateCareManagerTo({
          location: 'EPISODE_DETAILS_NOTES_TAB_EXISTING_NOTE',
          mockResp: false,
          episodeDetails: { noteType: NoteKind.DailyUpdate },
        });
      });

      it('should delete a team note', () => {
        interceptGETEpisodeDetails();

        const noteId = Cypress.env('currentNoteId');
        const noteOverviewId = getNoteListItemOverview(noteId);
        el(noteOverviewId).isVisible();
        el(getNoteListItemMenuButton(noteId)).click();
        el(getNoteListItemEditButton('delete')).click();
        isSnackbarVisible(SNACKBAR_MESSAGES.DELETED_NOTE);
        el(noteOverviewId).should('not.exist');
      });
    });

    describe('Edit Note', () => {
      NOTE_TYPES.forEach(({ labelText, kind }) => {
        beforeEach(() => {
          navigateCareManagerTo({
            location: 'EPISODE_DETAILS_NOTES_TAB_EXISTING_NOTE',
            mockResp: false,
            episodeDetails: { noteType: kind },
          });
        });

        const updatedNote = `This is the new updated ${labelText} Note`;

        it(`should edit a new ${labelText.toLowerCase()} team note`, () => {
          interceptPATCHNote({ mockResp: false });

          el(getNoteListItemMenuButton(Cypress.env('currentNoteId'))).click();
          el(getNoteListItemEditButton('edit')).click();

          el(EpisodeNotesTab.NOTE_OVERVIEW_EDIT_INPUT)
            .find('textarea')
            .eq(1)
            .clear({ force: true });
          el(EpisodeNotesTab.NOTE_OVERVIEW_EDIT_INPUT).type(updatedNote);
          el(EpisodeNotesTab.NOTE_OVERVIEW_EDIT_SAVE_BUTTON).click();
          isSnackbarVisible(SNACKBAR_MESSAGES.EDITED_NOTE);
          cy.wait('@interceptPATCHNote').then((interception) => {
            el(getNoteOverview(interception.response?.body.note?.id)).hasText(
              updatedNote
            );
          });
        });
      });
    });
  });
});
