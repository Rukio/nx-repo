import { el, timeoutOptions } from '@*company-data-covered*/cypress-shared';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { TaskTypeEnum } from '@*company-data-covered*/caremanager/data-access-types';
import { SNACKBAR_MESSAGES } from '@*company-data-covered*/caremanager/utils';
import {
  EpisodeTasksTab,
  TEST_CARE_MANAGER_ID,
  getTaskTextSelector,
  interceptPOSTEpisodeTask,
  isSnackbarVisible,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';

const newTask = () => {
  const taskDescription = 'New Task Test';
  el(EpisodeTasksTab.TASK_INPUT).first().type(taskDescription);
};

describe('Episode details tasks tab', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    navigateCareManagerTo({ location: 'EPISODE_DETAILS', mockResp: false });
    el(EpisodeTasksTab.EPISODE_TASKS_TAB).click();
  });

  describe('Initial State - Tasks Tabs', () => {
    beforeEach(() => {
      cy.deleteEpisodeTasks(TEST_CARE_MANAGER_ID)
        .then(() => cy.createTask(TaskTypeEnum.DailyAndOnboarding))
        .then(() => el(EpisodeTasksTab.EPISODE_TASKS_TAB).click());
    });

    it('should add a new task', () => {
      const taskDescription = 'New Task Test';
      interceptPOSTEpisodeTask({ mockResp: false });
      el(EpisodeTasksTab.TASK_INPUT).first().type(taskDescription);
      el(EpisodeTasksTab.TASK_SUBMIT_BUTTON).first().click();
      cy.wait('@interceptPOSTEpisodeTask').then((task) => {
        el(getTaskTextSelector(task?.response?.body.tasks[0].id)).hasText(
          taskDescription
        );
        isSnackbarVisible(SNACKBAR_MESSAGES.CREATED_TASK);
      });
    });

    it('should fail to add a new task', () => {
      newTask();
      cy.intercept('POST', '**/tasks', (req) => {
        req.destroy();
      });
      el(EpisodeTasksTab.TASK_SUBMIT_BUTTON).first().click();
      isSnackbarVisible(EpisodeTasksTab.DEFAULT_SNACKBAR_ERROR_MESSAGE);
    });

    it('should fail to delete a task', () => {
      newTask();
      el(EpisodeTasksTab.TASK_SUBMIT_BUTTON).first().click();
      cy.wait(timeoutOptions.VERY_SHORT_MS);
      cy.intercept('DELETE', '**/tasks/*', (req) => {
        req.destroy();
      });
      el(EpisodeTasksTab.TASK_MENU_BUTTON).first().click();
      el(EpisodeTasksTab.DELETE_MENU_ITEM).first().click({ force: true });
      isSnackbarVisible(EpisodeTasksTab.DEFAULT_SNACKBAR_ERROR_MESSAGE);
    });

    it('should add multiple new tasks', () => {
      interceptPOSTEpisodeTask({ mockResp: false });
      el(EpisodeTasksTab.TASK_INPUT)
        .first()
        .type('task1{shift+enter}', { release: false });
      el(EpisodeTasksTab.TASK_INPUT).first().type('task2');
      el(EpisodeTasksTab.TASK_INPUT)
        .first()
        .type('{shift+enter}task3{shift+enter}', { release: false });
      el(EpisodeTasksTab.TASK_INPUT)
        .first()
        .type('{shift+enter}task4')
        .type('{enter}');
      el(EpisodeTasksTab.TASK_SUBMIT_BUTTON).first().click();
      cy.wait('@interceptPOSTEpisodeTask').then((task) => {
        const list = [0, 1, 2, 3];
        list.forEach((i) =>
          el(getTaskTextSelector(task?.response?.body.tasks[i].id)).hasText(
            task?.response?.body.tasks[i].task
          )
        );
      });
    });
  });
});
