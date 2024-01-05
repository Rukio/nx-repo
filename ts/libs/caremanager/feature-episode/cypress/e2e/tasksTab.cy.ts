import { el } from '@*company-data-covered*/cypress-shared';
import {
  SNACKBAR_MESSAGES,
  formattedShortDate,
  getAvatarInitials,
} from '@*company-data-covered*/caremanager/utils';
import {
  EpisodeTasksTab,
  SNACKBAR,
  getCompletedAvatarSelector,
  getCompletedDateSelector,
  getCompletedIconSelector,
  getTaskAccordion,
  getTaskTextSelector,
  interceptDELETETask,
  interceptGETConfigData,
  interceptGETEpisodeBulkTask,
  interceptGETEpisodeTask,
  interceptGETEpisodeTaskUpdate,
  interceptGETUsers,
  interceptPOSTEpisodeTask,
  interceptPatchEpisodeTask,
  isSnackbarVisible,
  navigateCareManagerTo,
  taskTypes,
} from '@*company-data-covered*/caremanager/utils-e2e';
import { Task } from '@*company-data-covered*/caremanager/data-access-types';

const {
  EPISODE_TASKS_TAB,
  TASKS_TAB,
  TASK_INPUT,
  TASK_SUBMIT_BUTTON,
  DEFAULT_SNACKBAR_ERROR_MESSAGE,
  TASK_MENU_BUTTON,
  DELETE_MENU_ITEM,
  COMPLETED_TASK_ITEM,
  TASK_ITEM,
  COMPLETED_TASKS_SWITCH,
  EDIT_MENU_ITEM,
  UPDATE_TASK_INPUT,
  UPDATE_TASK_BUTTON,
  TASK_HEADER,
  PROGRESS_BAR,
  PROGRESS_BAR_LABEL,
  HIDE_COMPLETED_TASK,
  DAILY_AND_ONBOARDING_TASKS,
  T1_TASKS,
  T2_TASKS,
  NURSE_NAVIGATOR_TASKS,
  EXPAND_MORE_ICON,
} = EpisodeTasksTab;

const getNumberTasks = (tasks: Task[], status: string) =>
  tasks.reduce(
    (total: number, task) => (task.status === status ? total + 1 : total),
    0
  );

const getTasksByStatus = (tasks: Task[], status: string) =>
  tasks.filter((task) => task.status === status);

describe('Tasks Tab', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    interceptGETConfigData();
    interceptGETUsers();
    navigateCareManagerTo({ location: 'EPISODE_DETAILS' });
    el(EPISODE_TASKS_TAB).click({ force: true });
  });

  it('should expand and minimize each type of task', () => {
    el(EXPAND_MORE_ICON).each(($el: HTMLElement, index: number) => {
      if (index > 1) {
        cy.wrap($el).click();
      }
    });
    taskTypes.forEach((type) => {
      el(getTaskAccordion(type)).should('have.class', 'Mui-expanded');
    });
    el(EXPAND_MORE_ICON).each(($el: HTMLElement) => {
      cy.wrap($el).click();
    });
    taskTypes.forEach((type) => {
      el(getTaskAccordion(type)).should('not.have.class', 'Mui-expanded');
    });
  });

  describe('Tasks Tabs', () => {
    beforeEach(() => {
      el(TASKS_TAB).click();
    });

    it('should display correct tasks elements', () => {
      cy.fixture('apiResp/episodeDetailsTask').then(() => {
        el(TASK_HEADER).hasText('Tasks');
        el(PROGRESS_BAR).isVisible();
        el(PROGRESS_BAR).should('have.attr', 'aria-valuemin', '0');
        el(PROGRESS_BAR).should('have.attr', 'aria-valuemax', '100');
        el(PROGRESS_BAR).should('have.attr', 'aria-valuenow', '33');
        el(PROGRESS_BAR_LABEL).hasText('1/3');
        el(HIDE_COMPLETED_TASK).hasText('Hide Completed Tasks');
        el(HIDE_COMPLETED_TASK).find('input').isChecked();
        el(DAILY_AND_ONBOARDING_TASKS).hasText('Daily & Onboarding Tasks');
        el(NURSE_NAVIGATOR_TASKS).hasText('Nurse Navigator Tasks');
        el(T1_TASKS).hasText('T1 Tasks');
        el(T2_TASKS).hasText('T2 Tasks');
      });
    });

    it('should add a new task', () => {
      cy.fixture('apiResp/episodeDetailsTask').then(
        ({ episode: { tasks } }) => {
          const newTask = 'New Task Test';
          el(TASK_INPUT).first().click().type(newTask);
          interceptPOSTEpisodeTask();
          interceptGETEpisodeTask();
          el(TASK_SUBMIT_BUTTON).first().click();
          el(getTaskTextSelector(tasks[0].id)).hasText(newTask);
          isSnackbarVisible(SNACKBAR_MESSAGES.CREATED_TASK);
        }
      );
    });

    it.skip('should fail to add a new task', () => {
      // TODO: Add new task failure tests
      // TODO: test fails on local environment just here
      interceptPOSTEpisodeTask({ statusCode: 422 });
      const newTask = 'Fail Task Creation';
      el(TASK_INPUT).first().type(newTask);
      el(TASK_SUBMIT_BUTTON).first().type('{enter}');
      cy.wait('@interceptPOSTEpisodeTask').then(() => {
        isSnackbarVisible(DEFAULT_SNACKBAR_ERROR_MESSAGE);
      });
    });

    it('should add multiple new tasks', () => {
      cy.fixture('apiResp/episodeDetailsBulkTask').then(
        ({ episode: { tasks } }) => {
          el(TASK_INPUT)
            .first()
            .type('task1')
            .type('{shift}{enter}task2')
            .type('{shift}{enter}task3');
          interceptPOSTEpisodeTask();
          interceptGETEpisodeBulkTask();
          el(TASK_INPUT).first().type('{enter}');
          const task1 = tasks.find((task: Task) => task.task === 'task1');
          const task2 = tasks.find((task: Task) => task.task === 'task2');
          const task3 = tasks.find((task: Task) => task.task === 'task3');
          el(getTaskTextSelector(task1.id)).hasText(task1.task);
          el(getTaskTextSelector(task2.id)).hasText(task2.task);
          el(getTaskTextSelector(task3.id)).hasText(task3.task);
        }
      );
    });

    it('should update task counter when a new task is added', () => {
      cy.fixture('apiResp/episodeDetails').then(({ episode: { tasks } }) => {
        const prevPendingTasks = getTasksByStatus(tasks, 'pending');
        el(EPISODE_TASKS_TAB).hasText(`Tasks (${prevPendingTasks.length})`);
      });
      cy.fixture('apiResp/episodeDetailsTask').then(
        ({ episode: { tasks } }) => {
          const pendingTasks = getTasksByStatus(tasks, 'pending');
          const newTask = 'New Task Test';
          el(TASK_INPUT).first().click().type(newTask);
          interceptPOSTEpisodeTask();
          interceptGETEpisodeTask();
          el(TASK_SUBMIT_BUTTON).first().click();
          el(EPISODE_TASKS_TAB).hasText(`Tasks (${pendingTasks.length})`);
        }
      );
    });

    it('should delete a task', () => {
      interceptDELETETask();
      el(TASK_MENU_BUTTON).first().click();
      el(DELETE_MENU_ITEM).first().click();
      cy.wait('@interceptDELETETask').then(() => {
        isSnackbarVisible(SNACKBAR_MESSAGES.DELETED_TASK);
      });
    });

    it('should fail to delete a task', () => {
      interceptDELETETask({ statusCode: 422 });
      el(TASK_MENU_BUTTON).first().click();
      el(DELETE_MENU_ITEM).first().click();
      cy.wait('@interceptDELETETask').then(() => {
        cy.get(SNACKBAR).isVisible();
      });
    });

    it('should show complete tasks', () => {
      cy.fixture('apiResp/episodeDetails').then(({ episode: { tasks } }) => {
        el(COMPLETED_TASKS_SWITCH).click();
        const completedTask = tasks.find(
          (task: Task) => task.status === 'completed'
        );
        const totalCompleted = getNumberTasks(tasks, 'completed');
        el(COMPLETED_TASK_ITEM).hasLengthOf(totalCompleted);

        el(getCompletedIconSelector(completedTask.id)).isVisible();
        el(getCompletedDateSelector(completedTask.id)).hasText(
          formattedShortDate(new Date(completedTask.updated_at))
        );
        el(getTaskTextSelector(completedTask.id)).hasText(completedTask.task);
        cy.fixture('apiResp/users').then(({ users }) => {
          el(getCompletedAvatarSelector(completedTask.id)).hasText(
            getAvatarInitials(users[0].first_name, users[0].last_name)
          );
        });
      });
    });

    it('should hide completed tasks', () => {
      cy.fixture('apiResp/episodeDetails').then(({ episode: { tasks } }) => {
        const completedTask = tasks.find(
          (task: Task) => task.status === 'completed'
        );
        const totalCompleted = getNumberTasks(tasks, 'completed');
        el(getCompletedIconSelector(completedTask.id)).should('not.exist');
        el(TASK_ITEM).hasLengthOf(tasks.length - totalCompleted);
        el(COMPLETED_TASK_ITEM).should('not.exist');
      });
    });

    it('should update task', () => {
      cy.fixture('apiResp/episodeDetails').then(
        ({ episode: { tasks: mockedTasks } }) => {
          const tasks = [...mockedTasks];
          tasks[0].task = 'Updated Task';
          el(TASK_MENU_BUTTON).first().click();
          el(EDIT_MENU_ITEM).first().click();
          el(UPDATE_TASK_INPUT).clear().type('Updated Task');
          interceptPatchEpisodeTask();
          interceptGETEpisodeTaskUpdate();
          el(UPDATE_TASK_BUTTON).first().click();
          const updatedTask = tasks[0];
          isSnackbarVisible(SNACKBAR_MESSAGES.EDITED_TASK);
          el(getTaskTextSelector(updatedTask.id)).hasText(updatedTask.task);
        }
      );
    });
  });
});
