import { Cache } from 'cache-manager';
import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(mockCache);
});

export type MockCache = MockProxy<Cache>;

export const mockCache = mockDeep<Cache>();
