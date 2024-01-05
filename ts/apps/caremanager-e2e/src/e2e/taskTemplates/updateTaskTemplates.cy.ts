import { v4 as uuid } from 'uuid';
import { el } from '@*company-data-covered*/cypress-shared';
import { navigateTo } from '../helpers/navigationHelper';

// Selectors
const LOADING_TASK_TEMPLATES_LIST = 'loading-task-templates-list';
const TEMPLATE_SEARCH_INPUT = 'template-search-input';
const NAME_INPUT = 'create-task-template-details-name-text-area';
const CARE_PHASE_SELECT = 'create-task-template-details-care-phase-select';
const SERVICE_LINE_SELECT = 'create-task-template-details-service-line-select';
const SERVICE_LINE_EXTENDER_CARE_OPTION = 'servicelineid-extended-care-option';
const CARE_PHASE_EMPTY_OPTION = 'carephaseid--option';
const DAILY_AND_ONBOARDING_CATEGORY = 'daily-and-onboarding-test';
const T1_CATEGORY = 't1-test';
const T2_CATEGORY = 't2-test';
const NEW_TASK_INPUT = 'new-task-input';
const NEW_TASK_SUBMIT_BUTTON = 'submit-new-task';
const SAVE_TEMPLATE_BUTTON = 'task-template-submit-button';
const TASK_MENU_BUTTON = 'task-menu-button';
const TASK_UPDATE_INPUT = 'taskupdate-input';
const TASK_UPDATE_BUTTON = 'update-task-button';
const TASK_EDIT_MENU_BUTTON = 'task-edit-menu-item';
const TASK_TEMPLATES_EDIT_MENU_BUTTON = 'task-templates-edit-menu-item';
const TASK_DELETE_MENU_ITEM = 'task-delete-menu-item';
const getTaskTemplateRow = (id: string) => `task-template-row-${id}`;
const getTaskTemplateMoreButton = (id: string) =>
  `task-template-more-button-${id}`;

describe('Task Templates Creation E2E', () => {
  before(() => {
    cy.login();
  });

  context('task templates creation and edition', () => {
    beforeEach(() => {
      const templateName = uuid();
      cy.createTaskTemplate({
        name: templateName,
        tasks: [
          { body: 'A daily and onboarding task', task_type_id: 6 },
          { body: 'A nurse navigator task', task_type_id: 4 },
          { body: 'A t1 task', task_type_id: 7 },
        ],
      }).then(() => {
        Cypress.env('currentTemplateName', templateName);
        navigateTo({
          location: 'TASK_TEMPLATES_LIST',
        });
      });
    });

    it('should be able to edit a template', () => {
      const templateId = Cypress.env('currentTaskTemplateId');
      const templateName = Cypress.env('currentTemplateName');
      const newTemplateName = uuid();

      el(TEMPLATE_SEARCH_INPUT).type(templateName);
      el(LOADING_TASK_TEMPLATES_LIST);
      el(getTaskTemplateRow(templateId))
        .find(`[data-testid=${getTaskTemplateMoreButton(templateId)}]`)
        .click();
      el(TASK_TEMPLATES_EDIT_MENU_BUTTON).click();

      el(NAME_INPUT).find('#name').clear().type(newTemplateName);
      el(SERVICE_LINE_SELECT).click();
      el(SERVICE_LINE_EXTENDER_CARE_OPTION).click();

      el(DAILY_AND_ONBOARDING_CATEGORY)
        .find(`[data-testid=${TASK_MENU_BUTTON}]`)
        .click();
      el(TASK_EDIT_MENU_BUTTON).click();
      el(TASK_UPDATE_INPUT).clear().type('An updated daily task');
      el(TASK_UPDATE_BUTTON).click();

      el(T1_CATEGORY).click().find(`[data-testid=${TASK_MENU_BUTTON}]`).click();
      el(TASK_DELETE_MENU_ITEM).click();

      el(T2_CATEGORY)
        .click()
        .find(`[data-testid=${NEW_TASK_INPUT}]`)
        .type('New t2 task');
      el(T2_CATEGORY).find(`[data-testid=${NEW_TASK_SUBMIT_BUTTON}]`).click();

      el(SAVE_TEMPLATE_BUTTON).click();
      cy.get('#notistack-snackbar').hasText('Template saved');

      el(TEMPLATE_SEARCH_INPUT).type(newTemplateName);
      el(LOADING_TASK_TEMPLATES_LIST);
      el(getTaskTemplateRow(templateId))
        .find(`[data-testid=${getTaskTemplateMoreButton(templateId)}]`)
        .click();
      el(TASK_TEMPLATES_EDIT_MENU_BUTTON).click();

      el(DAILY_AND_ONBOARDING_CATEGORY)
        .find('li p')
        .hasText('An updated daily task');
      el(T1_CATEGORY).click().not('li p');
      el(T2_CATEGORY).click().find('li p').hasText('New t2 task');

      cy.deleteTaskTemplate(templateId);
    });

    it('should remove care phase on a template', () => {
      const templateId = Cypress.env('currentTaskTemplateId');
      const templateName = Cypress.env('currentTemplateName');

      el(TEMPLATE_SEARCH_INPUT).type(templateName);
      el(LOADING_TASK_TEMPLATES_LIST);
      el(getTaskTemplateRow(templateId))
        .find(`[data-testid=${getTaskTemplateMoreButton(templateId)}]`)
        .click();
      el(TASK_TEMPLATES_EDIT_MENU_BUTTON).click();

      el(CARE_PHASE_SELECT).click();
      el(CARE_PHASE_EMPTY_OPTION).click();

      el(SAVE_TEMPLATE_BUTTON).click();

      cy.get('#notistack-snackbar').hasText('Template saved');
      cy.deleteTaskTemplate(templateId);
    });
  });
});
