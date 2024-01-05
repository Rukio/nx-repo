import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { JobsService } from '../jobs.service';

beforeEach(() => {
  mockReset(mockJobsService);
});

export type MockJobsService = MockProxy<JobsService>;

export const mockJobsService = mockDeep<JobsService>();
