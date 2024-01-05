import { TaskTemplateFromJSONTyped } from '@*company-data-covered*/caremanager/data-access-types';
import { el } from '@*company-data-covered*/cypress-shared';

export const getTaskTemplateRow = (id: string) => `task-template-row-${id}`;
export const getTaskTemplateLink = (id: string) => `task-template-link-${id}`;
export const getTaskTemplateServiceLine = (id: string) =>
  `task-template-serviceline-${id}`;
export const getTaskTemplateCarePhase = (id: string) =>
  `task-template-carephase-${id}`;
export const getTaskTemplateSummary = (id: string) =>
  `task-template-summary-${id}`;
export const getTaskTemplateRowButton = (id: string) =>
  `task-template-more-button-${id}`;

export const validateTemplatesRows = (taskTemplates: []) => {
  taskTemplates.forEach((jsonTaskTemplate) => {
    const template = TaskTemplateFromJSONTyped(jsonTaskTemplate, false);
    el(getTaskTemplateRow(template.id)).isVisible();
    el(getTaskTemplateLink(template.id)).hasText(template.name);
    el(getTaskTemplateServiceLine(template.id)).hasText(
      template.serviceLine?.name || ''
    );
    if (template.carePhase) {
      el(getTaskTemplateCarePhase(template.id)).hasText(
        template.carePhase.name
      );
    }
    el(getTaskTemplateSummary(template.id)).hasText(template.summary || '');
    el(getTaskTemplateRowButton(template.id)).isEnabled();
  });
};
