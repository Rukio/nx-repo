import { mockDeep, mockReset } from 'jest-mock-extended';
import { Logger } from 'winston';

beforeEach(() => {
  mockReset(mockLogger);
});

const mockLogger = mockDeep<Logger>();
