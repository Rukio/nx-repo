import { sendDELETERequest, sendPOSTRequest } from './request';

const BASE_TASK_TEMPLATE_BODY = {
  name: 'Essentials',
  summary: 'Life is a simulation',
  service_line_id: 1,
  care_phase_id: 1,
  tasks: [
    {
      body: 'Measure body temperature',
      task_type_id: 6,
    },
  ],
};

export const createTaskTemplate = (
  body?: Partial<Cypress.TaskTemplateBody>,
  customIdEnvVarName?: string
) =>
  sendPOSTRequest({
    url: `${Cypress.env('API_URL')}/v1/task_templates`,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
    body: { ...BASE_TASK_TEMPLATE_BODY, ...body },
  }).then((response) => {
    Cypress.env(
      customIdEnvVarName || 'currentTaskTemplateId',
      response.body.task_template?.id
    );
    Cypress.env('currentTaskTemplateBody', response.body.task_template);

    return response.body;
  });

export const deleteTaskTemplate = (id: number) =>
  sendDELETERequest({
    url: `${Cypress.env('API_URL')}/v1/task_templates/${id}`,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
  }).then((deleteTaskTemplateResp) => deleteTaskTemplateResp.body);
