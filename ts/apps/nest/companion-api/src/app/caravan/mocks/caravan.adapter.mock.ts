import { mockReset, MockProxy, mockDeep } from 'jest-mock-extended';
import { CaravanAdapter } from '../caravan.adapter';

beforeEach(() => {
  mockReset(mockCaravanAdapter);
});

export type MockCaravanAdapter = MockProxy<CaravanAdapter>;

export const mockCaravanAdapter = mockDeep<CaravanAdapter>();
