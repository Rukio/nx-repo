// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  CareManagerServiceCreateEpisodeTasksOperationRequest,
  GetEpisodeResponse,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import { sendDELETERequest, sendPOSTRequest } from './request';

const TASK_DETAIL_BODY = {
  status: 'pending',
  task: 'This is the best task in the world',
};

function createTask(taskType: TaskTypeEnum, episodeId = '1') {
  const taskBody: CareManagerServiceCreateEpisodeTasksOperationRequest['body'] =
    {
      tasks: [
        {
          ...TASK_DETAIL_BODY,
          taskType: taskType,
        },
      ],
    };

  return sendPOSTRequest({
    url: `${Cypress.env('API_URL')}/v1/episodes/${episodeId}/tasks`,
    body: taskBody,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
  }).then((createTaskResp) => {
    const { id } = createTaskResp.body.tasks[0];
    Cypress.env(`${taskType}Id`, id);

    return id;
  });
}

function deleteTask(taskId: string) {
  return sendDELETERequest({
    url: `${Cypress.env('API_URL')}/v1/tasks/${taskId}`,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
  }).then((deleteTaskResp) => deleteTaskResp.body);
}

function deleteEpisodeTasks(episodeId: string) {
  cy.getEpisode(episodeId).then((resp: GetEpisodeResponse) => {
    resp.episode?.tasks?.forEach((task) => {
      cy.deleteTask(task.id, task.taskType);
    });
  });
}

export { createTask, deleteTask, deleteEpisodeTasks };
