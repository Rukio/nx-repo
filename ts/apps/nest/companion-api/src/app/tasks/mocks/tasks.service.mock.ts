import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { TasksService } from '../tasks.service';

beforeEach(() => {
  mockReset(mockTasksService);
});

export type MockTasksService = MockProxy<TasksService>;

export const mockTasksService = mockDeep<TasksService>();
