import { el } from '@*company-data-covered*/cypress-shared';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { TaskTypeEnum } from '@*company-data-covered*/caremanager/data-access-types';
import { navigateCareManagerTo } from '@*company-data-covered*/caremanager/utils-e2e';

const dailyAndOnboardingCell = (id: number) =>
  `dailyAndOnboarding-task-cell-${id}`;
const nurseNavigatorCell = (id: number) => `nurseNavigator-task-cell-${id}`;
const t1Cell = (id: number) => `t1-task-cell-${id}`;
const t2Cell = (id: number) => `t2-task-cell-${id}`;

const TASK_TYPES: {
  name: TaskTypeEnum;
  selector: (id: number) => string;
}[] = [
  { name: TaskTypeEnum.DailyAndOnboarding, selector: dailyAndOnboardingCell },
  {
    name: TaskTypeEnum.NurseNavigator,
    selector: nurseNavigatorCell,
  },
  {
    name: TaskTypeEnum.T1,
    selector: t1Cell,
  },
  {
    name: TaskTypeEnum.T2,
    selector: t2Cell,
  },
];

describe('Care Manager Navigation', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    Cypress.env('currentEpisodeId', '');
    Cypress.env('daily_and_onboardingId', '');
    Cypress.env('nurse_navigatorId', '');
    Cypress.env('t1Id', '');
    Cypress.env('t2Id', '');
    cy.createEpisode().then(() => {
      navigateCareManagerTo({
        location: 'CARE_MANAGER_MAIN',
        mockResp: false,
      });
    });
  });

  it('should count the incomplete tasks correctly when a task is added and delete', () => {
    const currentEpisodeId = Cypress.env('currentEpisodeId');

    TASK_TYPES.forEach((taskType) => {
      el(taskType.selector(currentEpisodeId)).should('not.exist');
      cy.createTask(taskType.name, currentEpisodeId)
        .then(() => {
          cy.reload();
          el(taskType.selector(currentEpisodeId)).hasText('1');
          const taskId = Cypress.env(`${taskType.name}Id`);

          cy.deleteTask(taskId, taskType.name);
        })
        .then(() => {
          cy.reload();
          el(taskType.selector(currentEpisodeId)).should('not.exist');
        });
    });
  });
});
