import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { ConsentsRepository } from '../consents.repository';

beforeEach(() => {
  mockReset(mockConsentsRepository);
});

export type MockConsentsRepository = MockProxy<ConsentsRepository>;

export const mockConsentsRepository = mockDeep<ConsentsRepository>();
