import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { mockClear, mockDeep, MockProxy } from 'jest-mock-extended';

beforeEach(() => {
  mockClear(mockConfigService);
});

export type MockConfigService = MockProxy<Cache>;

export const mockConfigService = mockDeep<ConfigService>({
  get: jest.fn().mockReturnValue('http://localhost:8181'),
});
