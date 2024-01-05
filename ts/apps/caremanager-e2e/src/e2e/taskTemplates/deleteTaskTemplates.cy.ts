import { v4 as uuid } from 'uuid';
import { el } from '@*company-data-covered*/cypress-shared';
import { navigateTo } from '../helpers/navigationHelper';

// Selectors
const NO_TEMPLATES_CONTAINER = 'no-templates-container';
const LOADING_TASK_TEMPLATES_LIST = 'loading-task-templates-list';
const TEMPLATE_SEARCH_INPUT = 'template-search-input';
const TASK_DELETE_MENU_ITEM = 'task-templates-delete-menu-item';
const DELETE_TEMPLATE_BUTTON_MODAL = 'delete-template-button';
const DELETE_TEMPLATE_BUTTON_FORM = 'task-template-delete-button';
const DELETE_TEMPLATE_CONFIRMATION_BUTTON =
  'delete-template-confirmation-button';
const getTaskTemplateRow = (id: string) => `task-template-row-${id}`;
const getTaskTemplateMoreButton = (id: string) =>
  `task-template-more-button-${id}`;

describe('Task Templates Creation E2E', () => {
  before(() => {
    cy.login();
  });

  context('deletion via options menu', () => {
    beforeEach(() => {
      cy.createTaskTemplate({
        name: uuid(),
      }).then(() => {
        navigateTo({
          location: 'TASK_TEMPLATES_LIST',
        });
      });
    });

    it('should be able to delete a template via options menu', () => {
      const templateId = Cypress.env('currentTaskTemplateId');
      const templateName = Cypress.env('currentTaskTemplateBody').name;

      el(TEMPLATE_SEARCH_INPUT).type(templateName);
      el(LOADING_TASK_TEMPLATES_LIST);

      el(getTaskTemplateRow(templateId))
        .find(`[data-testid=${getTaskTemplateMoreButton(templateId)}]`)
        .click();
      el(TASK_DELETE_MENU_ITEM).click();
      el(DELETE_TEMPLATE_BUTTON_MODAL).click();

      cy.get('#notistack-snackbar').hasText('Template deleted');

      el(TEMPLATE_SEARCH_INPUT).type(templateName);
      el(LOADING_TASK_TEMPLATES_LIST);
      el(NO_TEMPLATES_CONTAINER);
    });
  });

  context('delete via template details page', () => {
    beforeEach(() => {
      cy.createTaskTemplate({
        name: uuid(),
      }).then(() => {
        navigateTo({
          location: 'TASK_TEMPLATES_EDIT',
          id: Cypress.env('currentTaskTemplateId'),
        });
      });
    });

    it('should be able to delete a template via the template details page', () => {
      const templateName = Cypress.env('currentTaskTemplateBody').name;

      el(DELETE_TEMPLATE_BUTTON_FORM).click();
      el(DELETE_TEMPLATE_CONFIRMATION_BUTTON).click();

      cy.get('#notistack-snackbar').hasText('Template deleted');

      el(TEMPLATE_SEARCH_INPUT).type(templateName);
      el(LOADING_TASK_TEMPLATES_LIST);
      el(NO_TEMPLATES_CONTAINER);
    });
  });
});
