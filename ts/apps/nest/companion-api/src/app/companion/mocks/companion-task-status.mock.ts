import * as faker from 'faker';
import { CompanionTaskStatus, CompanionTaskStatusName } from '@prisma/client';
import { buildMockCompanionTask } from '../../tasks/mocks/companion-task.mock';

export const buildMockTaskStatus = (
  init?: Partial<CompanionTaskStatus>
): CompanionTaskStatus => ({
  id: faker.datatype.number(),
  name: CompanionTaskStatusName.NOT_STARTED,
  companionTaskId: buildMockCompanionTask().id,
  createdAt: new Date(),
  ...init,
});
