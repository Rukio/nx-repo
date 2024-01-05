import { v4 as uuid } from 'uuid';
import { el } from '@*company-data-covered*/cypress-shared';
import { SNACKBAR_MESSAGES } from '@*company-data-covered*/caremanager/utils';
import { isSnackbarVisible } from '@*company-data-covered*/caremanager/utils-e2e';
import { navigateTo } from '../helpers/navigationHelper';

/* Selectors */
const TEMPLATE_EDIT_SECTION = 'task-template-edit-section';
const SEARCH_CLICK_INPUT = 'task-template-search-click-input';
const SEARCH_INPUT = 'task-template-search-input';
const EPISODE_TASKS_TAB = 'episode-tasks-tab';
const DAILY_AND_ONBOARDING_TASKS_LIST = 'daily-and-onboarding-test';
const EDIT_CAREPHASE_SELECT = 'edit-episode-modal-care-phase-select';
const EDIT_EPISODE_SAVE = 'edit-episode-modal-save-button';
const getTemplateAddButton = (id: number) => `add-task-template-button-${id}`;
const getAddedListItem = (id: number) => `add-task-template-menu-item-${id}`;
const getCarePhaseOption = (phase: string) => `carephaseid-${phase}-option`;
const getTemplateRemoveButton = (id: number) =>
  `add-task-template-remove-item-${id}`;
const getEditEpisodeButton = (id: number) =>
  `edit-episode-details-episode-button-${id}`;

/* Mock data  */
const templateA = {
  name: uuid(),
  tasks: [
    {
      body: 'I came from template A',
      task_type_id: 6,
    },
  ],
};

const templateB = {
  name: uuid(),
  tasks: [
    {
      body: 'I came from template B',
      task_type_id: 6,
    },
    {
      body: 'I came from template B too!',
      task_type_id: 6,
    },
  ],
};

/* Helpers */
const searchAndAddTemplate = (name: string) => {
  el(SEARCH_CLICK_INPUT).click();
  el(SEARCH_INPUT).type(name);
  el(getTemplateAddButton(Cypress.env(`${name}-Id`))).click();
  el(SEARCH_INPUT).clear();
  cy.clickOutside();
  el(getAddedListItem(Cypress.env(`${name}-Id`))).hasText(name);
};

describe('Episode E2E', () => {
  before(() => {
    cy.login();

    cy.createTaskTemplate(templateA, `${templateA.name}-Id`);
    cy.createTaskTemplate(templateB, `${templateB.name}-Id`);
  });

  context('Edit episode', () => {
    before(() => {
      cy.createEpisode();
    });

    beforeEach(() => {
      navigateTo({
        location: 'EPISODES_EDIT',
        id: Cypress.env('currentEpisodeId'),
      });
    });

    it('should not display template section in edit', () => {
      el(TEMPLATE_EDIT_SECTION).should('not.exist');
    });

    context('Episode templates', () => {
      before(() => {
        cy.createEpisode();
      });

      beforeEach(() => {
        navigateTo({
          location: 'EPISODES_EDIT',
          id: Cypress.env('currentEpisodeId'),
        });
        // Open Edit modal
        el(getEditEpisodeButton(Cypress.env('currentEpisodeId'))).click();
        // Must have same carephase as created templates
        el(EDIT_CAREPHASE_SELECT).click();
        el(getCarePhaseOption('pending')).click();
      });

      it('should add a template and verify added tasks', () => {
        searchAndAddTemplate(templateB.name);
        el(EDIT_EPISODE_SAVE).click({ force: true });
        isSnackbarVisible(SNACKBAR_MESSAGES.EDITED_EPISODE);
        el(EPISODE_TASKS_TAB).click();
        el(DAILY_AND_ONBOARDING_TASKS_LIST)
          .hasText(templateB.tasks[0].body)
          .hasText(templateB.tasks[1].body);
      });

      it('should show when templates have been added', () => {
        const templateAId = Cypress.env(`${templateA.name}-Id`);
        const templateBId = Cypress.env(`${templateB.name}-Id`);
        el(getAddedListItem(templateBId)).hasText('Previously Added');
        searchAndAddTemplate(templateA.name);
        // Remove from added menu
        el(getTemplateRemoveButton(templateAId)).click();
        // "Add" button restored in menu
        el(SEARCH_CLICK_INPUT).click();
        el(SEARCH_INPUT).type(templateA.name);
        el(getTemplateAddButton(templateAId)).isVisible();
        el(SEARCH_INPUT).clear();
        cy.clickOutside();
        // Add Template A and verify all tasks added
        searchAndAddTemplate(templateA.name);
        el(EDIT_EPISODE_SAVE).click();
        isSnackbarVisible(SNACKBAR_MESSAGES.EDITED_EPISODE);
        el(EPISODE_TASKS_TAB).click();
        el(DAILY_AND_ONBOARDING_TASKS_LIST)
          .hasText(templateA.tasks[0].body)
          .hasText(templateB.tasks[0].body)
          .hasText(templateB.tasks[1].body);
        cy.deleteTaskTemplate(Cypress.env(`${templateA.name}-Id`));
        cy.deleteTaskTemplate(Cypress.env(`${templateB.name}-Id`));
      });
    });
  });
});
