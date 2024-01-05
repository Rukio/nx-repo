import { CompanionLink } from '@prisma/client';
import { CompanionTaskWithStatuses } from '../dto/companion-task-status.dto';

export type CompanionLinkWithTasks = CompanionLink & {
  tasks: CompanionTaskWithStatuses[];
};
