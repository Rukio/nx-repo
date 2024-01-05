// eslint-disable-next-line @nx/enforce-module-boundaries
import { NoteKind } from '@*company-data-covered*/caremanager/data-access-types';
import {
  interceptGETConfigData,
  interceptGETEpisodeDetails,
  interceptGETEpisodes,
  interceptGETPatientData,
  interceptGETTaskTemplates,
  interceptGETTemplateDetails,
} from './interceptHelper';
import { statsigHelper } from '../statsig/statsigHelper';

export type CARE_MANAGER_PAGES =
  | 'CARE_MANAGER_MAIN'
  | 'SETTINGS'
  | 'NEW_EPISODE'
  | 'EPISODE_DETAILS'
  | 'EPISODE_DETAILS_NOTES_TAB'
  | 'EPISODE_DETAILS_NOTES_TAB_EXISTING_NOTE'
  | 'TASK_TEMPLATES_CREATE'
  | 'TASK_TEMPLATES_EDIT'
  | 'PATIENT_PAGE';

export type CARE_MANAGER_STATES =
  | 'FORBIDDEN_ERROR'
  | 'SOMETHING_WENT_WRONG_ERROR';

export type CARE_MANAGER_404 = 'NOT_FOUND';

type EpisodeDetails = {
  noteType: NoteKind;
};

type NavigateCareManagerValues = {
  location: CARE_MANAGER_PAGES | CARE_MANAGER_STATES | CARE_MANAGER_404;
  mockResp?: boolean;
  episodeDetails?: EpisodeDetails;
  fixture?: string;
};

const defaultEpisodeDetails = {
  noteType: NoteKind.DailyUpdate,
};

export const TEST_CARE_MANAGER_ID = '1';

export const navigateCareManagerTo = (
  navigateCareManagerSetup: NavigateCareManagerValues
) => {
  const {
    location,
    mockResp = true,
    episodeDetails = defaultEpisodeDetails,
    fixture,
  } = navigateCareManagerSetup;

  switch (location) {
    case 'EPISODE_DETAILS':
      interceptGETEpisodeDetails({ mockResp });
      cy.visit(`/episodes/${TEST_CARE_MANAGER_ID}/overview`).then(() => {
        cy.wait('@interceptGETEpisodeDetails');
      });
      break;
    case 'EPISODE_DETAILS_NOTES_TAB':
      interceptGETEpisodeDetails({ mockResp });
      cy.visit(`/episodes/${TEST_CARE_MANAGER_ID}/notes`).then(() => {
        cy.wait('@interceptGETEpisodeDetails');
      });
      break;
    case 'EPISODE_DETAILS_NOTES_TAB_EXISTING_NOTE':
      cy.createNote(episodeDetails.noteType)
        .then((id) => {
          Cypress.env('currentNoteId', id);

          interceptGETEpisodeDetails({ mockResp });
          cy.visit(`/episodes/${TEST_CARE_MANAGER_ID}/notes`);
        })
        .then(() => {
          cy.wait('@interceptGETEpisodeDetails');
        });
      break;
    case 'NEW_EPISODE':
      interceptGETConfigData({ mockResp });
      interceptGETEpisodes({ mockResp });
      interceptGETPatientData({ mockResp });
      cy.visit('/episodes/new');
      break;
    case 'CARE_MANAGER_MAIN':
      if (!statsigHelper.featureGates.maintenanceMode()) {
        interceptGETConfigData({ mockResp });
        interceptGETEpisodes({ mockResp });
      }
      cy.visit(`/`).then(() => {
        if (!statsigHelper.featureGates.maintenanceMode()) {
          cy.wait('@interceptGETConfigData');
          cy.wait('@interceptGETEpisodes');
        }
      });
      break;
    case 'TASK_TEMPLATES_CREATE':
      interceptGETConfigData({ mockResp });
      cy.visit('/settings/task-templates/new').then(() => {
        cy.wait('@interceptGETConfigData');
      });
      break;
    case 'TASK_TEMPLATES_EDIT':
      interceptGETConfigData({ mockResp });
      interceptGETTemplateDetails({ mockResp });
      cy.visit('/settings/task-templates/2/edit').then(() => {
        cy.wait('@interceptGETConfigData');
        cy.wait('@interceptGETTemplateDetails');
      });
      break;
    case 'FORBIDDEN_ERROR':
      interceptGETConfigData({ mockResp });
      interceptGETEpisodes({ statusCode: 403, mockResp });
      cy.visit(`/`).then(() => {
        cy.wait('@interceptGETConfigData');
        cy.wait('@interceptGETEpisodes');
      });
      break;
    case 'SOMETHING_WENT_WRONG_ERROR':
      interceptGETConfigData({ mockResp });
      interceptGETEpisodes({ statusCode: 422, mockResp });
      cy.visit(`/`).then(() => {
        cy.wait('@interceptGETConfigData');
        cy.wait('@interceptGETEpisodes');
      });
      break;
    case 'NOT_FOUND':
      cy.visit(`/notfound`);
      break;
    case 'SETTINGS':
      interceptGETConfigData({ mockResp });
      interceptGETTaskTemplates({ mockResp, fixture });
      cy.visit('/settings/task-templates');
      break;
    case 'PATIENT_PAGE':
      cy.visit('/patients/1');
      break;
    default:
      break;
  }
};
