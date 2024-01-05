import { mockDeep, mockReset } from 'jest-mock-extended';
import { MemoryTokenStore } from '../lib/memory-token-store';

beforeEach(() => {
  mockReset(mockMemoryTokenStore);
});

export const mockMemoryTokenStore = mockDeep<MemoryTokenStore>();
