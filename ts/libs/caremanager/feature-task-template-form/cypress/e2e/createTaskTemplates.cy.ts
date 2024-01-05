import { el } from '@*company-data-covered*/cypress-shared';
import { SNACKBAR_MESSAGES } from '@*company-data-covered*/caremanager/utils';
import {
  interceptGETTaskTemplates,
  interceptPOSTTemplate,
  isSnackbarVisible,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import {
  CREATE_TASK_TEMPLATES_BACK_BUTTON,
  CREATE_TASK_TEMPLATES_HEADER,
  CREATE_TASK_TEMPLATES_HEADER_TITLE,
  CREATE_TASK_TEMPLATE_DETAILS_CARE_PHASE_SELECT,
  CREATE_TASK_TEMPLATE_DETAILS_HEADER,
  CREATE_TASK_TEMPLATE_DETAILS_NAME_TEXT_AREA,
  CREATE_TASK_TEMPLATE_DETAILS_SERVICE_LINE_SELECT,
  CREATE_TASK_TEMPLATE_DETAILS_SUMMARY_TEXT_AREA,
  CREATE_TASK_TEMPLATE_SUBMIT_BUTTON,
  SUBMIT_NEW_TASK,
  TASK_INPUT,
  selectCarePhaseOption,
  selectServiceLineOption,
} from './taskTemplates.utils';

describe('Templates creation', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    navigateCareManagerTo({ location: 'TASK_TEMPLATES_CREATE' });
    interceptGETTaskTemplates();
  });

  describe('Initial State', () => {
    it('should display page with all elements', () => {
      el(CREATE_TASK_TEMPLATES_HEADER).isVisible();
      el(CREATE_TASK_TEMPLATES_HEADER_TITLE).hasText('New Task Template');
    });

    it('should back to episodes on back button pressed', () => {
      el(CREATE_TASK_TEMPLATES_BACK_BUTTON).click();
      cy.hasPathname('blank');
    });

    it('should display details section', () => {
      el(CREATE_TASK_TEMPLATE_DETAILS_HEADER).hasText('Template Details');
      el(CREATE_TASK_TEMPLATE_DETAILS_NAME_TEXT_AREA).hasText(
        'Name (Required)'
      );
      el(CREATE_TASK_TEMPLATE_DETAILS_SERVICE_LINE_SELECT).isVisible();
      el(CREATE_TASK_TEMPLATE_DETAILS_CARE_PHASE_SELECT).isVisible();
      el(CREATE_TASK_TEMPLATE_DETAILS_SUMMARY_TEXT_AREA).hasText('Summary');
    });

    describe('post template', () => {
      beforeEach(() => {
        interceptPOSTTemplate();
        interceptGETTaskTemplates();
      });

      it('should create template', () => {
        cy.fixture('apiResp/taskTemplatesPost').then(({ task_template }) => {
          const { name, summary, service_line, care_phase, tasks } =
            task_template;
          const [task] = tasks;
          el(CREATE_TASK_TEMPLATE_DETAILS_NAME_TEXT_AREA).type(name);
          selectServiceLineOption(service_line);
          selectCarePhaseOption(care_phase);
          el(CREATE_TASK_TEMPLATE_DETAILS_SUMMARY_TEXT_AREA).type(summary);

          el(TASK_INPUT).eq(0).type(task.body);
          el(SUBMIT_NEW_TASK).eq(0).click();

          el(CREATE_TASK_TEMPLATE_SUBMIT_BUTTON).click();
          isSnackbarVisible(SNACKBAR_MESSAGES.CREATED_TEMPLATE);
        });
      });
      it('should create template without summary', () => {
        cy.fixture('apiResp/taskTemplatesPost').then(({ task_template }) => {
          const { name, service_line, care_phase, tasks } = task_template;
          const [task] = tasks;
          el(CREATE_TASK_TEMPLATE_DETAILS_NAME_TEXT_AREA).type(name);
          selectServiceLineOption(service_line);
          selectCarePhaseOption(care_phase);

          el(TASK_INPUT).eq(0).type(task.body);
          el(SUBMIT_NEW_TASK).eq(0).click();

          el(CREATE_TASK_TEMPLATE_SUBMIT_BUTTON).click();
          isSnackbarVisible(SNACKBAR_MESSAGES.CREATED_TEMPLATE);
        });
      });
    });
  });
});
