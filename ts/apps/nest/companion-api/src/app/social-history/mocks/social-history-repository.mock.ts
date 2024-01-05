import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { SocialHistoryRepository } from '../social-history.repository';

beforeEach(() => {
  mockReset(mockSocialHistoryRepository);
});

export type MockSocialHistoryRepository = MockProxy<SocialHistoryRepository>;

export const mockSocialHistoryRepository = mockDeep<SocialHistoryRepository>();
