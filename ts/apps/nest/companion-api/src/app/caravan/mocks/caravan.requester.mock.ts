import { mockReset, MockProxy, mockDeep } from 'jest-mock-extended';
import { CaravanRequester } from '../caravan.requester';

beforeEach(() => {
  mockReset(mockCaravanRequester);
});

export type MockCaravanRequester = MockProxy<CaravanRequester>;

export const mockCaravanRequester = mockDeep<CaravanRequester>();
