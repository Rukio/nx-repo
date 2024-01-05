import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { TasksRepository } from '../tasks.repository';

beforeEach(() => {
  mockReset(mockTasksRepository);
});

export type MockTasksRepository = MockProxy<TasksRepository>;

export const mockTasksRepository = mockDeep<TasksRepository>();
