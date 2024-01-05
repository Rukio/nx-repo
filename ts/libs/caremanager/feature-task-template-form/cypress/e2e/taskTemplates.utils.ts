import { el } from '@*company-data-covered*/cypress-shared';
import { getListItem } from '@*company-data-covered*/caremanager/utils-e2e';

export type FilterOption = {
  id: number;
  name: string;
};

export const CREATE_TASK_TEMPLATES_HEADER = 'create-task-templates-header';
export const CREATE_TASK_TEMPLATES_HEADER_TITLE =
  'create-task-templates-header-title';
export const CREATE_TASK_TEMPLATES_BACK_BUTTON =
  'create-task-templates-back-button';
export const CREATE_TASK_TEMPLATE_DETAILS_HEADER =
  'create-task-template-details-header';
export const CREATE_TASK_TEMPLATE_DETAILS_NAME_TEXT_AREA =
  'create-task-template-details-name-text-area';
export const CREATE_TASK_TEMPLATE_DETAILS_SERVICE_LINE_SELECT =
  'create-task-template-details-service-line-select';
export const CREATE_TASK_TEMPLATE_DETAILS_CARE_PHASE_SELECT =
  'create-task-template-details-care-phase-select';
export const CREATE_TASK_TEMPLATE_DETAILS_SUMMARY_TEXT_AREA =
  'create-task-template-details-summary-text-area';
export const CREATE_TASK_TEMPLATE_SUBMIT_BUTTON =
  'create-task-template-submit-button';
export const TASK_INPUT = 'task-input';
export const SUBMIT_NEW_TASK = 'submit-new-task';

export const selectServiceLineOption = (serviceLine: FilterOption) => {
  const { name } = serviceLine;
  el(CREATE_TASK_TEMPLATE_DETAILS_SERVICE_LINE_SELECT).click();
  el(getListItem('servicelineid', name)).click();
  el(CREATE_TASK_TEMPLATE_DETAILS_SERVICE_LINE_SELECT).hasText(name);
};

export const selectCarePhaseOption = (carePhase: FilterOption) => {
  const { name } = carePhase;
  el(CREATE_TASK_TEMPLATE_DETAILS_CARE_PHASE_SELECT).click();
  el(getListItem('carephaseid', name)).click();
  el(CREATE_TASK_TEMPLATE_DETAILS_CARE_PHASE_SELECT).hasText(name);
};
