import { DatadogService } from '@*company-data-covered*/nest-datadog';
import { mockReset, MockProxy, mockDeep } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(mockDatadogService);
});

export type MockDatadogService = MockProxy<DatadogService>;

export const mockDatadogService = mockDeep<DatadogService>();
