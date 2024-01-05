import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { ConsentsService } from '../consents.service';

beforeEach(() => {
  mockReset(mockConsentsService);
});

export type MockConsentsService = MockProxy<ConsentsService>;

export const mockConsentsService = mockDeep<ConsentsService>();
