import { mockDeep, MockProxy, mockReset } from 'jest-mock-extended';
import { SmsService } from '../sms.service';

beforeEach(() => {
  mockReset(mockSmsService);
});

export type MockSmsService = MockProxy<SmsService>;

export const mockSmsService = mockDeep<SmsService>({
  executeFlow: jest.fn(),
});
