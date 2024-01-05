import { el } from '@*company-data-covered*/cypress-shared';
import {
  ACTIVE_CARE_PHASES,
  CARE_PHASE_ACTIVE_SUBHEADING,
  CARE_PHASE_DROPDOWN_LIST,
  CARE_PHASE_INACTIVE_SUBHEADING,
  CLEAR_FILTER_BUTTON,
  DONE_FILTER_BUTTON,
  SERVICE_LINE_DROPDOWN_LIST,
  interceptDELETETaskTemplate,
  interceptGETDeletedTaskTemplates,
  interceptGETUsers,
  navigateCareManagerTo,
  selectAllFilterOptions,
} from '@*company-data-covered*/caremanager/utils-e2e';
import {
  getTaskTemplateRow,
  getTaskTemplateRowButton,
  validateTemplatesRows,
} from '../support/selectors';

const CLOSED_CARE_PHASE_FILTER = 'closed-care-phase-filter';
const CARE_PHASE_FILTER = 'care-phase-filter';
const CLEAR_ALL_BUTTON = 'clear-all-button';
const FILTERS_BY_TEXT = 'filter-by-text';
const SERVICE_LINE_FILTER = 'service-line-filter';
const SETTINGS_HEADER = 'settings-header';
const TASK_TEMPLATES_SECTION = 'task-templates-section';
const TASK_TEMPLATE_SEARCH_INPUT = 'search-input';
const NO_TEMPLATES_CONTAINER = 'no-templates-container';
const CREATE_TEMPLATE_BUTTON =
  'templates-no-templates-add-task-templates-router-button';
const DELETE_MENU_ITEM = 'task-templates-delete-menu-item';
const DELETE_TASK_TEMPLATE_MODAL = 'delete-task-template-modal';
const DELETE_TEMPLATE_BUTTON = 'delete-template-button';
const TABLE_PAGINATION_COUNT = 'table-pagination-count';
const TASK_TEMPLATES_LABEL = 'task-templates-table';
const SEARCH_INPUT = 'search-input';
const NEXT_PAGE_BUTTON = 'KeyboardArrowRightIcon';

describe('Settings', () => {
  before(() => {
    cy.login();
  });

  describe('Initial State', () => {
    describe('Empty Task Templates response', () => {
      beforeEach(() => {
        navigateCareManagerTo({
          location: 'SETTINGS',
          fixture: 'taskTemplatesEmpty',
        });
      });

      it('should display the empty state of the task template table', () => {
        el(NO_TEMPLATES_CONTAINER).hasText('No templates found');
        el(CREATE_TEMPLATE_BUTTON).hasText('Create Template');
      });
    });

    describe('Initial state', () => {
      beforeEach(() => {
        interceptGETUsers();
        navigateCareManagerTo({
          location: 'SETTINGS',
        });
        cy.wait('@interceptGETTaskTemplates');
      });

      it('should navigate to settings', () => {
        el(FILTERS_BY_TEXT).hasText('Filter by');
        el(SERVICE_LINE_FILTER).hasText('Service Line');
        el(CARE_PHASE_FILTER).hasText('Care Phase');
        el(CLEAR_ALL_BUTTON).should('not.exist');
        cy.hasPathname('/settings/task-templates');
        el(SETTINGS_HEADER).isVisible();
        el(TASK_TEMPLATES_SECTION).isVisible();
        el(TASK_TEMPLATE_SEARCH_INPUT).hasPlaceholder(
          'Search by template name'
        );
      });

      it('should display the tasks templates table', () => {
        cy.fixture('apiResp/taskTemplates').then(({ task_templates }) => {
          validateTemplatesRows(task_templates);
        });
      });

      it('should delete a template', () => {
        cy.fixture('apiResp/taskTemplates').then(({ task_templates }) => {
          const { id } = task_templates[0];
          const deletedTemplate = getTaskTemplateRow(id);
          el(deletedTemplate).should('exist');
          interceptDELETETaskTemplate();
          interceptGETDeletedTaskTemplates();
          el(getTaskTemplateRowButton(id)).click();
          el(DELETE_MENU_ITEM).click();
          el(DELETE_TASK_TEMPLATE_MODAL).isVisible();
          el(DELETE_TEMPLATE_BUTTON).click();

          el(deletedTemplate).should('not.exist');
        });
      });
      describe('Filters', () => {
        describe('Service Line Filter', () => {
          it('should clear service lines filter', () => {
            el(SERVICE_LINE_FILTER).click();
            selectAllFilterOptions(
              SERVICE_LINE_FILTER,
              SERVICE_LINE_DROPDOWN_LIST
            );
            el(CLEAR_FILTER_BUTTON).click();
            el(SERVICE_LINE_FILTER).hasText('Service Line');
          });

          it('should add service lines filter', () => {
            el(SERVICE_LINE_FILTER).hasText('Service Line');
            selectAllFilterOptions(
              SERVICE_LINE_FILTER,
              SERVICE_LINE_DROPDOWN_LIST
            );
            el(DONE_FILTER_BUTTON).click();
            el(SERVICE_LINE_FILTER).hasText('All 4 Service Lines');
          });
        });

        describe('Care Phase Filter', () => {
          it('should clear care phase filters', () => {
            el(CARE_PHASE_FILTER).click();
            el(CARE_PHASE_ACTIVE_SUBHEADING).hasText('ACTIVE');
            el(CARE_PHASE_INACTIVE_SUBHEADING).hasText('INACTIVE');
            selectAllFilterOptions(CARE_PHASE_FILTER, CARE_PHASE_DROPDOWN_LIST);
            el(CLEAR_FILTER_BUTTON).click();
            el(CARE_PHASE_FILTER).hasText('Care Phase');
          });

          it('should add active care phase filters', () => {
            el(CARE_PHASE_FILTER).click();
            ACTIVE_CARE_PHASES.forEach((carePhase) => {
              el(CARE_PHASE_DROPDOWN_LIST).contains(carePhase).click();
            });
            el(DONE_FILTER_BUTTON).click();
            el(CARE_PHASE_FILTER).hasText('Active');
          });

          it('should add care phase filters', () => {
            el(CARE_PHASE_FILTER).click();
            selectAllFilterOptions(CARE_PHASE_FILTER, CARE_PHASE_DROPDOWN_LIST);
            el(DONE_FILTER_BUTTON).click();
            el(CARE_PHASE_FILTER).hasText('All 6 Care Phases');
          });

          it('should show Closed episodes', () => {
            el(CLOSED_CARE_PHASE_FILTER).hasText('Show Closed');
            el(CLOSED_CARE_PHASE_FILTER).click();
            el(CLOSED_CARE_PHASE_FILTER).hasText('Hide Closed');
            el(CLOSED_CARE_PHASE_FILTER).click();
            el(CLOSED_CARE_PHASE_FILTER).hasText('Show Closed');
          });
        });

        describe('Clear All Link', () => {
          it('should clear all filter options', () => {
            selectAllFilterOptions(
              SERVICE_LINE_FILTER,
              SERVICE_LINE_DROPDOWN_LIST
            );
            el(DONE_FILTER_BUTTON).click();
            selectAllFilterOptions(CARE_PHASE_FILTER, CARE_PHASE_DROPDOWN_LIST);
            el(DONE_FILTER_BUTTON).click();
            el(CLEAR_ALL_BUTTON).click();
            el(SERVICE_LINE_FILTER).hasText('Service Line');
            el(CARE_PHASE_FILTER).hasText('Care Phase');
            el(CLOSED_CARE_PHASE_FILTER).hasText('Show Closed');
          });

          it('should be visible when each filter is selected', () => {
            selectAllFilterOptions(
              SERVICE_LINE_FILTER,
              SERVICE_LINE_DROPDOWN_LIST
            );
            el(DONE_FILTER_BUTTON).click();
            el(CLEAR_ALL_BUTTON).should('exist').click().should('not.exist');
            selectAllFilterOptions(CARE_PHASE_FILTER, CARE_PHASE_DROPDOWN_LIST);
            el(DONE_FILTER_BUTTON).click();
            el(CLEAR_ALL_BUTTON).should('exist').click().should('not.exist');
            el(SERVICE_LINE_FILTER).hasText('Service Line');
            el(CARE_PHASE_FILTER).hasText('Care Phase');
            el(CARE_PHASE_FILTER).hasText('Care Phase');
          });
        });
      });
    });

    describe('Url params', () => {
      beforeEach(() => {
        interceptGETUsers();
        navigateCareManagerTo({
          location: 'SETTINGS',
        });
      });
      it('should start with selected filter values', () => {
        cy.visit(
          '/settings/task-templates/?name=Superman&serviceLineId=1&carePhaseId=2'
        );

        el(TASK_TEMPLATE_SEARCH_INPUT).should('have.value', 'Superman');
        el(SERVICE_LINE_FILTER).hasText('Advanced');
        el(CARE_PHASE_FILTER).hasText('High Acuity');
      });

      it('should start with selected page', () => {
        cy.visit('/settings/task-templates/?page=2&pageSize=1');
        el(TASK_TEMPLATES_LABEL).click();
        el(TABLE_PAGINATION_COUNT).scrollIntoView().hasText('2-2 of 7');
      });

      it('should start with selected page size', () => {
        cy.visit('/settings/task-templates/?pageSize=5');
        el(TASK_TEMPLATES_LABEL).click();
        el(TABLE_PAGINATION_COUNT).scrollIntoView().hasText('1-5 of 7');
      });

      it('should paginate properly', () => {
        cy.visit('/settings/task-templates/?pageSize=1');
        el(NEXT_PAGE_BUTTON).click();
        cy.url().should('contain', 'page=2');
        el(SEARCH_INPUT).type('none');
        cy.url().should('contain', 'name=none');
        cy.url().should('contain', 'page=1');

        el(NEXT_PAGE_BUTTON).click();
        cy.url().should('contain', 'page=2');
        el(CARE_PHASE_FILTER).click({ force: true });
        selectAllFilterOptions(CARE_PHASE_FILTER, CARE_PHASE_DROPDOWN_LIST);
        el(DONE_FILTER_BUTTON).click();
        cy.url().should('contain', 'page=1');

        el(NEXT_PAGE_BUTTON).click();
        cy.url().should('contain', 'page=2');
        el(SERVICE_LINE_FILTER).click({ force: true });
        selectAllFilterOptions(SERVICE_LINE_FILTER, SERVICE_LINE_DROPDOWN_LIST);
        el(DONE_FILTER_BUTTON).click();
        cy.url().should('contain', 'page=1');
      });
    });
  });
});
