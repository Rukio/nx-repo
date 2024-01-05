import { el, timeoutOptions } from '@*company-data-covered*/cypress-shared';
import {
  TEST_CARE_MANAGER_ID,
  interceptGETConfigData,
  interceptGETEpisodeDetails,
  interceptGETPatientDetails,
  interceptGETProviderTypes,
  interceptGETUsers,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';

const EPISODE_BASE_URL = `/episodes/${TEST_CARE_MANAGER_ID}`;
const EPISODE_TASKS_TAB = 'episode-tasks-tab';
const EPISODE_NOTES_TAB = 'episode-notes-tab';
const EPISODE_OVERVIEW_TAB = 'episode-overview-tab';
const EPISODE_BACK_BUTTON = 'episode-header-back-button';

const getPatientDetailsLink = (cmId: string) => `patient-details-link-${cmId}`;

describe('Tabs Navigation', () => {
  before(() => {
    cy.login();
  });

  describe('Initial State', () => {
    beforeEach(() => {
      interceptGETConfigData();
      interceptGETUsers();
      interceptGETPatientDetails();
      interceptGETProviderTypes();
      navigateCareManagerTo({ location: 'EPISODE_DETAILS' });
    });

    it('should navigate between tabs', () => {
      el(EPISODE_OVERVIEW_TAB).click();
      cy.hasPathname(`${EPISODE_BASE_URL}/overview`);
      el(EPISODE_TASKS_TAB).click();
      cy.hasPathname(`${EPISODE_BASE_URL}/tasks`);
      el(EPISODE_NOTES_TAB).click();
      cy.hasPathname(`${EPISODE_BASE_URL}/notes`);
    });
  });

  describe('Back button', () => {
    beforeEach(() => {
      interceptGETConfigData();
      interceptGETUsers();
      interceptGETEpisodeDetails();
      interceptGETPatientDetails();
      interceptGETProviderTypes();
      navigateCareManagerTo({ location: 'CARE_MANAGER_MAIN' });
      cy.wait(timeoutOptions.VERY_TINY_MS);
      el(getPatientDetailsLink(TEST_CARE_MANAGER_ID)).click({
        force: true,
      });
    });

    it('should navigate back from tasks tab', () => {
      el(EPISODE_NOTES_TAB).click();
      el(EPISODE_OVERVIEW_TAB).click();
      el(EPISODE_TASKS_TAB).click();
      el(EPISODE_BACK_BUTTON).click();
      cy.hasPathname('/episodes');
    });

    it('should navigate back from notes tab', () => {
      el(EPISODE_OVERVIEW_TAB).click();
      el(EPISODE_TASKS_TAB).click();
      el(EPISODE_NOTES_TAB).click();
      el(EPISODE_BACK_BUTTON).click();
      cy.hasPathname('/episodes');
    });

    it('should navigate back from overview tab', () => {
      el(EPISODE_TASKS_TAB).click();
      el(EPISODE_NOTES_TAB).click();
      el(EPISODE_OVERVIEW_TAB).click();
      el(EPISODE_BACK_BUTTON).click();
      cy.hasPathname('/episodes');
    });
  });
});
