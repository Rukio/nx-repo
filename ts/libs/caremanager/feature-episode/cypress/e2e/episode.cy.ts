import { el } from '@*company-data-covered*/cypress-shared';
import {
  SNACKBAR_MESSAGES,
  calculateDays,
  formattedDateWithTime,
  getAvatarInitials,
  getFullName,
  getShortDateDescription,
} from '@*company-data-covered*/caremanager/utils';
import { NoteKind } from '@*company-data-covered*/caremanager/data-access-types';
import {
  SNACKBAR,
  getConfigResponseMock,
  getListItem,
  interceptDELETEDailyUpdate,
  interceptGETConfigData,
  interceptGETDeletedDailyUpdate,
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  interceptGETTaskTemplates,
  interceptGETUpdatedEpisodeDetails,
  interceptGETUpdatedNotes,
  interceptGETUsers,
  interceptPATCHEpisodeDetails,
  interceptPATCHNote,
  interceptPOSTNote,
  isSnackbarVisible,
  navigateCareManagerTo,
  validateHeader,
} from '@*company-data-covered*/caremanager/utils-e2e';

/* Selectors */
const DEFAULT_SNACKBAR_ERROR_MESSAGE = 'Unknown error';
const PATIENT_DETAILS_NAME = 'patient-details-name';
const getAthenaLabel = (id: string) => `athena-label-${id}`;
const getPatientCareLineLabel = (id: string) => `patient-care-line-label-${id}`;
const getLengthOfCareLabel = (id: string) => `length-of-care-label-${id}`;
const EPISODE_BACK_BUTTON = 'episode-header-back-button';
const TABS_COMPONENT = 'tabs-component';
const EPISODE_OVERVIEW_TAB = 'episode-overview-tab';
const NOTES_ICON = 'NotesIcon';
const EPISODE_TASKS_TAB = 'episode-tasks-tab';
const CHECK_CIRCLE_OUTLINE_ICON = `CheckCircleOutlineIcon`;
const EPISODE_NOTES_TAB = 'episode-notes-tab';
const COMMENT_ICON = 'CommentIcon';
const getEditEpisodeDetailsButton = (id: string) =>
  `edit-episode-details-episode-button-${id}`;
const getEpisodeIdNumberLabel = (id: string) => `episode-id-label-${id}`;
const getPatientCareDays = (id: string) => `care-days-label-${id}`;
const EPISODE_SUMMARY_LABEL = 'episode-summary-label';
const EPISODE_SUMMARY_BODY = 'episode-summary-body';
const EPISODE_SUMMARY_EDIT_BUTTON = 'episode-summary-edit-button';
const EDIT_ICON = 'EditIcon';
const getNoteOverview = (id: string) => `note-overview-${id}`;
const getNoteOverviewAvatar = (id: string) => `note-overview-avatar-${id}`;
const getNoteOverviewSubtitleLabel = (id: number, type: string) =>
  `note-subtitle-${type}-label-${id}`;
const getNoteOverviewDetails = (id: string) => `note-overview-details-${id}`;
const EPISODES_NOTE_OVERVIEW = 'note-overview-episodes';
const DAILY_UPDATES_LABEL = 'daily-updates-label';
const EDIT_MENU_ITEM = 'note-overview-edit-menu-item';
const DELETE_MENU_ITEM = 'note-overview-delete-menu-item';
const EPISODE_SUMMARY_TEXT_AREA = 'episode-summary-text-area';
const EDIT_SUMMARY_SAVE_BUTTON = 'edit-summary-save-button';
const EDIT_SUMMARY_CANCEL_BUTTON = 'edit-summary-cancel-button';
const EDIT_EPISODE_MODAL = 'edit-episode-modal-dialog';
const EDIT_EPISODE_MODAL_TITLE = 'edit-episode-modal-title';
const EDIT_EPISODE_MODAL_CANCEL_BUTTON = 'edit-episode-modal-cancel-button';
const EDIT_EPISODE_MODAL_SAVE_BUTTON = 'edit-episode-modal-save-button';
const EDIT_EPISODE_MODAL_ADMITTED_AT_INPUT =
  'edit-episode-modal-admitted-at-date';
const EDIT_EPISODE_MODAL_IS_WAIVER_TOGGLE =
  'edit-episode-modal-is-waiver-toggle';
const EDIT_EPISODE_MODAL_MARKET_INPUT = 'edit-episode-modal-market-select';
const EDIT_EPISODE_MODAL_CARE_PHASE_INPUT =
  'edit-episode-modal-care-phase-select';
const CREATE_NOTE_TEXT_FIELD = 'create-note-text-field';
const CREATE_NOTE_POST_BUTTON = 'create-note-post-button';
const NOTE_OVERVIEW_EDIT_INPUT = 'note-overview-edit-input';
const NOTE_OVERVIEW_EDIT_SAVE_BUTTON = 'note-overview-edit-save-button';
const EPISODE_WAIVER_CHIP = 'episode-waiver-chip';
const getNoteListItemMenuButton = (id: number) =>
  `note-overview-more-button-${id}`;
const getNoteListItemOverview = (id: number) => `note-overview-${id}`;
const getNoteListItemDetails = (id: number) => `note-overview-details-${id}`;
const getNoteListItemEditButton = (option: string) =>
  `note-overview-${option}-menu-item`;

/* Helpers */

type FilterOption = {
  id: string;
  name: string;
};

type Task = {
  status: string;
};

const selectMarketFilter = (market: FilterOption) => {
  const { name } = market;
  el(getListItem('marketid', name)).click();
  el(EDIT_EPISODE_MODAL_MARKET_INPUT).hasText(name);
};

const selectCarePhaseFilter = (carePhase: FilterOption) => {
  const { name } = carePhase;
  el(getListItem('carephaseid', name)).click();
  el(EDIT_EPISODE_MODAL_CARE_PHASE_INPUT).hasText(name);
};

const isWaiverToggle = () => {
  el(EDIT_EPISODE_MODAL_IS_WAIVER_TOGGLE).children().isUnchecked();
  el(EDIT_EPISODE_MODAL_IS_WAIVER_TOGGLE).click();
  el(EDIT_EPISODE_MODAL_IS_WAIVER_TOGGLE).children().isChecked();
};

const getDateString = (date: Date) => {
  const month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;

  return `${month}/${date.getDate()}/${date.getFullYear()}`;
};

const getPendingTasks = (tasks: Task[] | undefined) => {
  let pendingTasks = 0;
  if (tasks) {
    pendingTasks = tasks.filter((task) => task.status !== 'completed').length;
  }

  return pendingTasks;
};

describe('Individual Episode Details', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETConfigData();
    interceptGETUsers();
    interceptGETPatientDetails();
    interceptGETProviderTypes();
    navigateCareManagerTo({ location: 'EPISODE_DETAILS' });
  });

  describe('Initial State - Overview Tab', () => {
    it('should display correct patient information', () => {
      validateHeader();
      cy.fixture('apiResp/episodeDetails').then(
        ({
          episode: {
            id,
            service_line,
            care_phase,
            patient,
            admitted_at,
            discharged_at,
            patient_summary,
            notes,
            tasks,
          },
        }) => {
          const {
            first_name,
            middle_name,
            last_name,
            athena_medical_record_number,
          } = patient;
          const { details } = notes[0];
          const dateToShow =
            notes[0].updated_at || notes[0].created_at || new Date();
          const formattedDateStringArray = formattedDateWithTime(
            new Date(dateToShow)
          ).split('at');
          el(EPISODE_BACK_BUTTON).hasText('Episodes').isEnabled();
          el(PATIENT_DETAILS_NAME).hasText(
            getFullName({
              firstName: first_name,
              middleName: middle_name,
              lastName: last_name,
            })
          );
          el(getAthenaLabel(id)).hasText(`MRN ${athena_medical_record_number}`);
          el(getPatientCareLineLabel(id)).hasText(
            `${service_line.name}, ${care_phase.name}`
          );
          el(getLengthOfCareLabel(id)).hasText(
            `LOS ${calculateDays(
              new Date(admitted_at),
              new Date(discharged_at)
            )} d`
          );
          el(getEditEpisodeDetailsButton(patient.id))
            .hasText('Edit Episode Details')
            .isEnabled();
          el(TABS_COMPONENT).isVisible();
          el(EPISODE_OVERVIEW_TAB)
            .hasText('Overview')
            .hasHref(`/episodes/${id}/overview`);
          el(NOTES_ICON).isVisible();
          if (Cypress.env('LOCAL_MODE')) {
            el(EPISODE_TASKS_TAB)
              .hasText('Tasks (2)')
              .hasHref(`/episodes/${id}/tasks`);
          } else {
            el(EPISODE_TASKS_TAB)
              .hasText(`Tasks (${getPendingTasks(tasks)})`)
              .hasHref(`/episodes/${id}/tasks`);
          }
          el(CHECK_CIRCLE_OUTLINE_ICON).isVisible();
          el(EPISODE_NOTES_TAB)
            .hasText('Notes')
            .hasHref(`/episodes/${id}/notes`);
          el(COMMENT_ICON).isVisible();
          el(getEpisodeIdNumberLabel(patient.id)).hasText(`Episode ${id}`);
          el(getPatientCareDays(id)).hasText(
            `${getShortDateDescription(
              new Date(admitted_at)
            )} - ${getShortDateDescription(new Date(discharged_at))}`
          );
          el(EPISODE_SUMMARY_LABEL).hasText('Summary');
          el(EPISODE_SUMMARY_BODY).hasText(patient_summary);
          el(EDIT_ICON).isVisible();
          el(EPISODE_SUMMARY_EDIT_BUTTON).hasText('Edit Summary');
          el(EPISODES_NOTE_OVERVIEW).isVisible();
          el(DAILY_UPDATES_LABEL).hasText('Daily Team Updates');
          el(CREATE_NOTE_TEXT_FIELD)
            .find('textarea')
            .hasPlaceholder('Add a note for the team');
          el(getNoteOverview(id)).isVisible();
          el(getNoteOverviewSubtitleLabel(id, 'date')).hasText(
            `${formattedDateStringArray[0].trim()} at `
          );
          el(getNoteOverviewSubtitleLabel(id, 'time')).hasText(
            `${formattedDateStringArray[1].trim()} · `
          );
          el(getNoteOverviewSubtitleLabel(id, 'kind')).hasText(`Daily Updates`);
          el(getNoteOverviewDetails(id)).hasText(`${details}`);
          el(getNoteListItemMenuButton(id)).click();
          el(EDIT_MENU_ITEM).hasText('Edit');
          el(DELETE_MENU_ITEM).hasText('Delete');
          cy.fixture('apiResp/users').then(({ users }) => {
            el(getNoteOverviewAvatar(id)).hasText(
              getAvatarInitials(users[0].first_name, users[0].last_name)
            );
          });
        }
      );
    });

    it('should edit episode details', () => {
      interceptGETTaskTemplates();
      const market = getConfigResponseMock.markets[2];

      cy.fixture('apiResp/episodeDetails')
        .then(({ episode: { patient } }) => {
          // TODO: Add edit episode details tests for data saving
          interceptPATCHEpisodeDetails();
          el(getEditEpisodeDetailsButton(patient.id)).click();
          cy.wait('@interceptGETConfigData');
        })
        .then(() => {
          el(EDIT_EPISODE_MODAL_MARKET_INPUT).click();
          selectMarketFilter(market);
          el(EDIT_EPISODE_MODAL_SAVE_BUTTON).click();
          cy.wait('@interceptPATCHEpisodeDetails');
        })
        .then(() => {
          isSnackbarVisible(SNACKBAR_MESSAGES.EDITED_EPISODE);
          el(EPISODE_WAIVER_CHIP).hasText('Waiver');
        });
    });

    it('should fail to edit episode details', () => {
      interceptGETTaskTemplates();

      const market = getConfigResponseMock.markets[2];

      cy.fixture('apiResp/episodeDetails')
        .then(({ episode: { patient } }) => {
          // TODO: Add edit episode details failure test
          interceptPATCHEpisodeDetails({ statusCode: 422 });
          el(getEditEpisodeDetailsButton(patient.id)).click();
        })
        .then(() => {
          el(EDIT_EPISODE_MODAL_MARKET_INPUT).click();
          selectMarketFilter(market);
          el(EDIT_EPISODE_MODAL_SAVE_BUTTON).click();
          cy.wait('@interceptPATCHEpisodeDetails');
          isSnackbarVisible(DEFAULT_SNACKBAR_ERROR_MESSAGE);
        });
    });
  });

  describe('Edit Episode Details', () => {
    beforeEach(() => {
      interceptGETTaskTemplates();
    });

    it('should display edit episode modal', () => {
      cy.fixture('apiResp/episodeDetails').then(({ episode: { id } }) => {
        el(getEditEpisodeDetailsButton(id)).click({ force: true });
        el(EDIT_EPISODE_MODAL).isVisible();
        el(EDIT_EPISODE_MODAL_TITLE).isVisible().hasText('Episode Details');
        el(EDIT_EPISODE_MODAL_ADMITTED_AT_INPUT).hasText('Admission Date');
        el(EDIT_EPISODE_MODAL_MARKET_INPUT).hasText('Market');
        el(EDIT_EPISODE_MODAL_CARE_PHASE_INPUT).hasText('Care Phase');
        el(EDIT_EPISODE_MODAL_CANCEL_BUTTON)
          .scrollIntoView()
          .hasText('Cancel')
          .isEnabled();
        el(EDIT_EPISODE_MODAL_SAVE_BUTTON).hasText('Save').isDisabled();
      });
    });

    it('should update the episode details', () => {
      cy.fixture('apiResp/episodeDetailsUpdate').then(({ episode }) => {
        const {
          id,
          service_line,
          care_phase,
          market,
          discharged_at,
          admitted_at,
        } = episode;
        const admittedAt = new Date(admitted_at);
        const admittedAtString = getDateString(admittedAt);
        el(getEditEpisodeDetailsButton(id)).click({ force: true });
        el(EDIT_EPISODE_MODAL).isVisible();

        el(EDIT_EPISODE_MODAL_ADMITTED_AT_INPUT)
          .find('input.MuiInputBase-input')
          .clear({ force: true })
          .type(admittedAtString, { force: true });
        isWaiverToggle();
        el(EDIT_EPISODE_MODAL_MARKET_INPUT).click();
        selectMarketFilter(market);
        el(EDIT_EPISODE_MODAL_CARE_PHASE_INPUT).click();
        selectCarePhaseFilter(care_phase);
        interceptPATCHEpisodeDetails();
        el(EDIT_EPISODE_MODAL_SAVE_BUTTON).click();

        const updatedPatientCareLineLabel = `${service_line.name}, ${care_phase.name}`;
        el(getPatientCareLineLabel(id)).hasText(updatedPatientCareLineLabel);
        el(getPatientCareDays(id)).hasText(
          `${getShortDateDescription(admittedAt)} - ${getShortDateDescription(
            new Date(discharged_at)
          )}`
        );
      });
    });
  });

  describe('Initial state - Episode summary', () => {
    it('should create external links for summary', () => {
      interceptGETTaskTemplates();

      cy.fixture('apiResp/episodeDetails').then(
        ({ episode: { patient_summary } }) => {
          // Match all links started with http or https
          const LINKS_REGEX = new RegExp(
            /(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/gm
          );
          const matches = patient_summary.match(LINKS_REGEX);
          matches.forEach((match: string) => {
            el('episode-summary-body')
              .contains('a', match)
              .should('have.attr', 'target', '_blank');
          });
        }
      );
    });
  });

  describe('Edit Episode Summary', () => {
    beforeEach(() => {
      el(EPISODE_SUMMARY_EDIT_BUTTON).click();
    });

    it('should display edit summary text area', () => {
      cy.fixture('apiResp/episodeDetails').then(
        ({ episode: { patient_summary } }) => {
          el(EPISODE_SUMMARY_EDIT_BUTTON).should('not.exist');
          el(EPISODE_SUMMARY_TEXT_AREA).hasText(patient_summary);
          el(EDIT_SUMMARY_SAVE_BUTTON).hasText('Save');
          el(EDIT_SUMMARY_CANCEL_BUTTON)
            .hasText('Cancel')
            .click({ force: true });
          el(EPISODE_SUMMARY_EDIT_BUTTON).isVisible();
          el(EPISODE_SUMMARY_TEXT_AREA).should('not.exist');
          el(EDIT_SUMMARY_SAVE_BUTTON).should('not.exist');
          el(EDIT_SUMMARY_CANCEL_BUTTON).should('not.exist');
        }
      );
    });

    it('should update the episode summary', () => {
      cy.fixture('apiResp/episodeDetailsUpdate').then(
        ({ episode: { patient_summary } }) => {
          el(EPISODE_SUMMARY_TEXT_AREA)
            .find('textarea')
            .eq(1)
            .clear({ force: true });
          el(EPISODE_SUMMARY_TEXT_AREA).type(patient_summary);
          interceptPATCHEpisodeDetails();
          el(EDIT_SUMMARY_SAVE_BUTTON).click();
          el(EPISODE_SUMMARY_BODY).hasText(patient_summary);
          isSnackbarVisible(SNACKBAR_MESSAGES.EDITED_EPISODE);
        }
      );
    });
  });

  describe('Daily Team Updates', () => {
    it('should add a new team note.', () => {
      cy.fixture('apiResp/episodeNotesPost').then(
        ({ note: { id, details } }) => {
          const note = 'This is a new note';
          el(CREATE_NOTE_TEXT_FIELD)
            .find('textarea')
            .eq(1)
            .clear({ force: true });
          el(CREATE_NOTE_TEXT_FIELD).type(note);
          interceptPOSTNote({ noteKind: NoteKind.DailyUpdate });
          interceptGETUpdatedEpisodeDetails();

          el(CREATE_NOTE_POST_BUTTON).click();

          el(getNoteOverview(id)).hasText(details);
        }
      );
    });

    it('should edit a team note', () => {
      cy.fixture('apiResp/episodeDetailsUpdate').then(
        ({ episode: { notes } }) => {
          const noteId = notes[1].id;
          el(getNoteListItemMenuButton(noteId)).click();
          el(getNoteListItemEditButton('edit')).click();

          const updatedNote = 'This is the new updated Daily Updates Note';
          el(NOTE_OVERVIEW_EDIT_INPUT)
            .find('textarea')
            .eq(1)
            .clear({ force: true });
          el(NOTE_OVERVIEW_EDIT_INPUT).type(updatedNote);
          interceptPATCHNote();
          interceptGETUpdatedNotes({
            noteKind: NoteKind.DailyUpdate,
            kindText: 'Daily Updates',
            arrayIndex: 1,
          });
          el(NOTE_OVERVIEW_EDIT_SAVE_BUTTON).click();
          el(getNoteListItemDetails(noteId)).hasText(updatedNote);
        }
      );
    });

    it('should delete a team note', () => {
      cy.fixture('apiResp/episodeDetailsUpdate').then(
        ({ episode: { notes } }) => {
          const noteId = notes[1].id;
          const noteOverviewId = getNoteListItemOverview(noteId);

          el(noteOverviewId).isVisible();
          interceptDELETEDailyUpdate();
          interceptGETDeletedDailyUpdate();

          el(getNoteListItemMenuButton(noteId)).click();
          el(getNoteListItemEditButton('delete')).click();

          el(noteOverviewId).should('not.exist');
        }
      );
    });

    it('should fail to edit a note', () => {
      interceptPATCHNote({ statusCode: 422 });
      el(getNoteListItemMenuButton(1)).click();
      el(getNoteListItemEditButton('edit')).click();
      el(NOTE_OVERVIEW_EDIT_INPUT).type('For the horde');
      el(NOTE_OVERVIEW_EDIT_SAVE_BUTTON).click();
      cy.wait('@interceptPATCHNote').then(() => {
        isSnackbarVisible(DEFAULT_SNACKBAR_ERROR_MESSAGE);
      });
    });

    it('should fail to delete a note', () => {
      interceptDELETEDailyUpdate({ statusCode: 422, fixture: '' });
      el(getNoteListItemMenuButton(1)).click();
      el(DELETE_MENU_ITEM).click();
      cy.wait('@interceptDELETEDailyUpdate').then(() => {
        cy.get(SNACKBAR).isVisible();
      });
    });
  });
});
