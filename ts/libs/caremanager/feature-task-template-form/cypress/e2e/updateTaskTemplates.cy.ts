import { el } from '@*company-data-covered*/cypress-shared';
import {
  interceptGETTaskTemplates,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';
import {
  CREATE_TASK_TEMPLATE_DETAILS_CARE_PHASE_SELECT,
  CREATE_TASK_TEMPLATE_DETAILS_HEADER,
  CREATE_TASK_TEMPLATE_DETAILS_SERVICE_LINE_SELECT,
} from './taskTemplates.utils';

describe('Individual Task Template Details', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETTaskTemplates();
    navigateCareManagerTo({ location: 'TASK_TEMPLATES_EDIT' });
  });

  describe('Initial State', () => {
    it('should load details', () => {
      cy.fixture('apiResp/taskTemplateDetails').then(({ task_template }) => {
        const { name, service_line, care_phase, summary } = task_template;
        el(CREATE_TASK_TEMPLATE_DETAILS_HEADER).hasText('Template Details');
        el('name-input').hasValue(name);
        el(CREATE_TASK_TEMPLATE_DETAILS_SERVICE_LINE_SELECT).hasText(
          service_line.name
        );
        el(CREATE_TASK_TEMPLATE_DETAILS_CARE_PHASE_SELECT).hasText(
          care_phase.name
        );
        el('summary-input').hasValue(summary);
      });
    });
  });
});
