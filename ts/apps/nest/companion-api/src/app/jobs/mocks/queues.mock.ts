import { Queue } from 'bull';
import { mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(mockRunningLateSmsQueue);
});

export const mockRunningLateSmsQueue = mockDeep<Queue>();
