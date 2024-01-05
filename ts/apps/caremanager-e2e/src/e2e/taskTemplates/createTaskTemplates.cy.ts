import { v4 as uuid } from 'uuid';
import { el } from '@*company-data-covered*/cypress-shared';
import { navigateTo } from '../helpers/navigationHelper';
import { interceptPOSTTemplate } from '../helpers/interceptHelper';

// Selectors
const LOADING_TASK_TEMPLATES_LIST = 'loading-task-templates-list';
const NAME_INPUT = 'create-task-template-details-name-text-area';
const SERVICE_LINE_SELECT = 'create-task-template-details-service-line-select';
const SERVICE_LINE_EXTENDER_CARE_OPTION = 'servicelineid-extended-care-option';
const CARE_PHASE_SELECT = 'create-task-template-details-care-phase-select';
const CARE_PHASE_DISCHARGED_OPTION = 'carephaseid-discharged-option';
const SUMMARY_INPUT = 'create-task-template-details-summary-text-area';
const TASK_CATEGORY_1 = 't1-test';
const TASK_CATEGORY_2 = 't2-test';
const NEW_TASK_INPUT = 'new-task-input';
const NEW_TASK_SUBMIT_BUTTON = 'submit-new-task';
const CREATE_TEMPLATE_BUTTON = 'create-task-template-submit-button';
const TEMPLATE_SEARCH_INPUT = 'template-search-input';
const SUBMIT_TEMPLATE_ERROR_NO_TASKS = 'submit-template-error-no-tasks';
const SUBMIT_TEMPLATE_ERROR_MISSING_DETAILS =
  'submit-template-error-missing-details';
const getTaskTemplateRow = (id: string) => `task-template-row-${id}`;

const tasksAmount = {
  [TASK_CATEGORY_1]: 10,
  [TASK_CATEGORY_2]: 5,
};

describe('Task Templates Creation E2E', () => {
  before(() => {
    cy.login();
  });

  context('Templates data', () => {
    beforeEach(() => {
      navigateTo({ location: 'TASK_TEMPLATES_CREATE' });
      interceptPOSTTemplate();
    });

    it('should be able to create a template', () => {
      const templateName = uuid();

      el(NAME_INPUT).type(templateName);
      el(SERVICE_LINE_SELECT).click();
      el(SERVICE_LINE_EXTENDER_CARE_OPTION).click();
      el(CARE_PHASE_SELECT).click();
      el(CARE_PHASE_DISCHARGED_OPTION).click();
      el(SUMMARY_INPUT).type('Created from Cypress');

      Object.entries(tasksAmount).forEach(([category, amount]) => {
        el(category).click();
        for (let i = 1; i <= amount; i++) {
          el(category)
            .find(`[data-testid=${NEW_TASK_INPUT}]`)
            .type(`Task ${i}`);
          el(category).find(`[data-testid=${NEW_TASK_SUBMIT_BUTTON}]`).click();
        }
      });

      el(CREATE_TEMPLATE_BUTTON).click();

      cy.wait('@interceptPOSTTemplate').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        const templateId = interception.response?.body.task_template?.id;
        cy.get('#notistack-snackbar').hasText('Template created');
        el(TEMPLATE_SEARCH_INPUT).type(templateName);
        el(LOADING_TASK_TEMPLATES_LIST);
        el(getTaskTemplateRow(templateId));
        cy.deleteTaskTemplate(templateId);
      });
    });

    it('should show an error when missing entering data', () => {
      el(CREATE_TEMPLATE_BUTTON).click();
      el(SUBMIT_TEMPLATE_ERROR_NO_TASKS).click();
      el(SUBMIT_TEMPLATE_ERROR_MISSING_DETAILS).click();
    });
  });
});
