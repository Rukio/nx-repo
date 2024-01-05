import * as faker from 'faker';
import {
  CompanionLink,
  CompanionTaskStatusName,
  CompanionTaskType,
} from '@prisma/client';
import { CompanionLinkWithTasks } from '../interfaces/companion-link.interface';
import {
  buildMockCompanionTask,
  buildMockCompanionTaskStatus,
} from '../../tasks/mocks/companion-task.mock';

export const buildMockCompanionLink = (
  init: Partial<CompanionLink> = {}
): CompanionLink => ({
  id: faker.datatype.uuid(),
  careRequestId: faker.datatype.number(),
  created: new Date(),
  invalidAuthCount: 0,
  isBlocked: false,
  lastInvalidAuth: null,
  createdNotificationSent: false,
  onRouteNotificationSent: false,
  ...init,
});

export const buildMockCompanionLinkWithTasks = (
  init: Partial<CompanionLinkWithTasks> = {}
): CompanionLinkWithTasks => {
  const mockCompanionLink = buildMockCompanionLink();

  return {
    ...mockCompanionLink,
    tasks: Object.keys(CompanionTaskType).map((key) =>
      buildMockCompanionTask({
        companionLinkId: mockCompanionLink.id,
        type: CompanionTaskType[key as keyof typeof CompanionTaskType],
        statuses: [
          buildMockCompanionTaskStatus({
            name: CompanionTaskStatusName.NOT_STARTED,
          }),
        ],
      })
    ),
    ...init,
  };
};
