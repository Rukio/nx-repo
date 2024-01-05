import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import {
  CalledWithMock,
  mockDeep,
  MockProxy,
  mockReset,
} from 'jest-mock-extended';

beforeEach(() => {
  mockReset(mockConfigService);
});

export type ConfigGetWithOneArg = CalledWithMock<
  unknown,
  [propertyPath: string]
>;

export type MockConfigService = MockProxy<Cache>;

export const mockConfigService = mockDeep<ConfigService>();
