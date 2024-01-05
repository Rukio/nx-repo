import { el, timeoutOptions } from '@*company-data-covered*/cypress-shared';
import {
  EpisodeNotesTab,
  EpisodeTasksTab,
  getNoteListItemDetails,
  getNoteListItemMenuButton,
  interceptDELETENote,
  interceptGETEpisodes,
  interceptGETVisitsList,
  interceptPATCHNote,
  interceptPATCHVisitStatus,
  interceptPOSTNote,
  interceptPOSTVisitSummary,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { setupE2ECareRequest } from '../helpers/caremanagerHelper';
import { navigateTo } from '../helpers/navigationHelper';

/*Selectors */
const {
  EPISODE_TASKS_TAB,
  TASK_INPUT,
  TASK_SUBMIT_BUTTON,
  TASK_ITEM,
  T1_TASKS,
  T2_TASKS,
} = EpisodeTasksTab;

const {
  CREATE_NOTE_TEXT_FIELD,
  CREATE_NOTE_POST_BUTTON,
  EDIT_MENU_ITEM,
  NOTE_OVERVIEW_EDIT_INPUT,
  NOTE_OVERVIEW_EDIT_SAVE_BUTTON,
  DELETE_MENU_ITEM,
} = EpisodeNotesTab;

/* Selectors */
const CLEAR_BUTTON = 'clear-button';
const EPISODES_SEARCH_INPUT = 'search-input';
const EPISODE_SUMMARY_EDIT_BUTTON = 'episode-summary-edit-button';
const EPISODE_SUMMARY_TEXT_AREA = 'episode-summary-text-area';
const EDIT_SUMMARY_SAVE_BUTTON = 'edit-summary-save-button';
const EPISODE_SUMMARY_BODY = 'episode-summary-body';
const EPISODE_NOTES_TAB = 'episode-notes-tab';
const VISIT_STATUS_UPDATE_BUTTON = 'visit-status-update-button';
const EPISODES_VISITS_TAB = 'episode-visits-tab';
const VISIT_STATUS_TITLE = 'visit-status-title';
const getPatientDetailsLink = (cmId: string) => `patient-details-link-${cmId}`;
const getVisitCard = (id: string) => `visit-card-${id}`;
const VISIT_ADD_SUMMARY_BUTTON = 'summary-create-button';
const VISIT_SUMMARY_TEXT_AREA = 'summary-edit-text-area';
const VISIT_SUMMARY_EDIT_BODY = 'body-input';
const VISIT_SUMMARY_SAVE_BUTTON = 'summary-edit-save-button';
const VISIT_SUMMARY_BODY = 'summary-body';

/* Test Data */
const NOTE_TEXT = 'e2e test';
const NOTE_EDIT = 'e2e test change';
const CLINICAL_SUMMARY_TEXT = 'Critial Path E2E Test';
const VISIT_SUMMARY_TEXT = 'End of Critial Path E2E Test';

/* Helpers */

const visitStatusResponse = (route: string, retries = 10) => {
  el(VISIT_STATUS_UPDATE_BUTTON).click();
  cy.wait(route)
    .its('response.statusCode')
    .then((response) => {
      if (response === 200) {
        for (let i = 0; i < 3; i++) {
          el(VISIT_STATUS_UPDATE_BUTTON).click();
        }

        return;
      } else if (retries > 0) {
        cy.wait(timeoutOptions.SHORT_MS);
        visitStatusResponse(route, retries - 1);
      }
    });
};

const createNewTasks = (task: string) => {
  el(EPISODE_TASKS_TAB).click({ force: true });
  function createTaskList(id: number) {
    const newTask = 'Task';
    for (let i = 0; i < 5; i++) {
      el(TASK_INPUT)
        .eq(id)
        .click()
        .type(`${newTask} ${i + 1} `);
      el(TASK_SUBMIT_BUTTON).eq(id).click();
    }
  }
  switch (task) {
    case 'daily':
      createTaskList(0);
      break;
    case 'nurse':
      createTaskList(1);
      break;
    case 't1':
      el(T1_TASKS).click();
      createTaskList(2);
      break;
    case 't2':
      el(T2_TASKS).click();
      createTaskList(3);
      break;
  }
};

const verifyTasksListAmount = () => el(TASK_ITEM).should('have.length', 20);

/* Tests */
describe('New Patient Care Manager Episode', () => {
  before(() => {
    cy.onlyOn(!Cypress.env('local'));
    setupE2ECareRequest();
  });

  beforeEach(() => {
    cy.login();
    navigateTo({ location: 'EPISODES_HOMEPAGE' });
  });

  it('should complete patient visit flow from start to finish', () => {
    const firstName = Cypress.env('currentPatientFirstName');
    el(CLEAR_BUTTON).click({ force: true });
    el(EPISODES_SEARCH_INPUT).clear().type(firstName);

    // Searching for newly created patient
    interceptGETEpisodes({ mockResp: false });
    cy.wait('@interceptGETEpisodes')
      .its('response.body')
      .then((id) => {
        el(getPatientDetailsLink(id.episodes[0].patient_id)).click();
      });

    // Edit Clinical Summary
    el(EPISODE_SUMMARY_EDIT_BUTTON).click();
    el(EPISODE_SUMMARY_TEXT_AREA)
      .find('textarea')
      .eq(0)
      .clear({ force: true })
      .type(CLINICAL_SUMMARY_TEXT);
    el(EDIT_SUMMARY_SAVE_BUTTON).click();
    el(EPISODE_SUMMARY_BODY).hasText(CLINICAL_SUMMARY_TEXT);

    // Create Tasks: Daily & Onboarding, Nurse Navigator, T1, and T2
    createNewTasks('daily');
    createNewTasks('nurse');
    createNewTasks('t1');
    createNewTasks('t2');
    verifyTasksListAmount();

    // Create Notes: New Note, Validate Text, Edit Note and Delete Note
    interceptPOSTNote({ mockResp: false });
    el(EPISODE_NOTES_TAB).click();
    el(CREATE_NOTE_TEXT_FIELD).click().type(NOTE_TEXT);
    el(CREATE_NOTE_POST_BUTTON).click();

    cy.wait('@interceptPOSTNote').then((request) => {
      const note = request?.response?.body?.note;
      el(getNoteListItemDetails(note.id)).hasText(note.details);
      el(getNoteListItemMenuButton(note.id)).click();
      el(EDIT_MENU_ITEM).click();
      el(NOTE_OVERVIEW_EDIT_INPUT).click().type(NOTE_EDIT);
      interceptPATCHNote({ mockResp: false });
      el(NOTE_OVERVIEW_EDIT_SAVE_BUTTON).click();
    });

    cy.wait('@interceptPATCHNote').then((request) => {
      const note = request?.response?.body?.note;
      el(getNoteListItemDetails(note.id)).hasText(note.details);
      el(getNoteListItemMenuButton(note.id)).click();
      interceptDELETENote({ mockResp: false });
      el(DELETE_MENU_ITEM).click();
    });

    cy.wait('@interceptDELETENote').should((body) => {
      expect(body.response?.statusCode, 'successful DELETE').to.equal(200);
    });

    // Complete Visit and Resolve Case
    interceptGETVisitsList({ mockResp: false });
    el(EPISODES_VISITS_TAB).click();
    cy.wait('@interceptGETVisitsList')
      .its('response.body.visits')
      .then((visit) => {
        const visitId = visit[0].id;
        el(getVisitCard(visitId)).click();
        interceptPOSTVisitSummary({ mockResp: false });
        el(VISIT_ADD_SUMMARY_BUTTON).click();
        el(VISIT_SUMMARY_TEXT_AREA).click();
        el(VISIT_SUMMARY_EDIT_BODY).eq(0).type(VISIT_SUMMARY_TEXT);
        el(VISIT_SUMMARY_SAVE_BUTTON).click();
      });

    cy.wait('@interceptPOSTVisitSummary').then((request) => {
      const body = request?.response.body?.summary.body;
      interceptPATCHVisitStatus({ mockResp: false });
      cy.wait(timeoutOptions.SHORT_MS);
      visitStatusResponse('@interceptPATCHVisitStatus');
      el(VISIT_SUMMARY_BODY).eq(0).hasText(body);
      el(VISIT_STATUS_TITLE).hasText('Resolved');
    });
  });
});
