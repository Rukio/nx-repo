import { PolicyService } from '@*company-data-covered*/nest/policy';
import { mockDeep, mockReset } from 'jest-mock-extended';

beforeEach(() => {
  mockReset(mockPolicyService);
});

export const mockPolicyService = mockDeep<PolicyService>();
