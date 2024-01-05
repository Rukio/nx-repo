import { v4 as uuid } from 'uuid';
import { el } from '@*company-data-covered*/cypress-shared';
import { navigateTo } from '../helpers/navigationHelper';

// Selectors
const TEMPLATE_SEARCH_INPUT = 'template-search-input';
const NEXT_PAGE_BUTTON = 'KeyboardArrowRightIcon';
const getTaskTemplateRow = (taskId: string) => `task-template-row-${taskId}`;

describe('Task Templates List E2E', () => {
  before(() => {
    cy.login();
  });

  context('existing content', () => {
    beforeEach(() =>
      cy
        .createTaskTemplate({ name: uuid() })
        .then(() => navigateTo({ location: 'TASK_TEMPLATES_LIST' }))
    );

    it('should navigate to the task templates list section and sees a template listed', () => {
      const templateId = Cypress.env('currentTaskTemplateId');
      const templateName = Cypress.env('currentTaskTemplateBody').name;
      el(TEMPLATE_SEARCH_INPUT).type(templateName);
      el(getTaskTemplateRow(templateId));
    });

    afterEach(() =>
      cy.deleteTaskTemplate(Cypress.env('currentTaskTemplateId'))
    );
  });

  context('existing content - pagination', () => {
    beforeEach(() => {
      cy.createTaskTemplate({ name: uuid() }, 'currentTaskTemplateIdSecond');
      cy.createTaskTemplate({ name: uuid() }).then(() =>
        navigateTo({
          location: 'TASK_TEMPLATES_LIST',
          searchParams: '?pageSize=2&page=1',
        })
      );
    });

    it('should paginate task templates', () => {
      cy.url({ decode: true }).should('contain', 'page=1');
      el(NEXT_PAGE_BUTTON).click();
      cy.url({ decode: true }).should('contain', 'page=2');
    });

    afterEach(() => {
      cy.deleteTaskTemplate(Cypress.env('currentTaskTemplateId'));
      cy.deleteTaskTemplate(Cypress.env('currentTaskTemplateIdSecond'));
    });
  });
});
