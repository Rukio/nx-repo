import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { SegmentService } from '@*company-data-covered*/nest-segment';

beforeEach(() => {
  mockReset(mockSegmentService);
});

export type MockSegmentService = MockProxy<SegmentService>;

export const mockSegmentService = mockDeep<SegmentService>();
