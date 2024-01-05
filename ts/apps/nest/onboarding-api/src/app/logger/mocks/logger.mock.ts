import { mockReset, MockProxy, mockDeep } from 'jest-mock-extended';
import { Logger } from 'winston';

beforeEach(() => {
  mockReset(mockLogger);
});

export type MockLogger = MockProxy<Logger>;

export const mockLogger = mockDeep<Logger>();
