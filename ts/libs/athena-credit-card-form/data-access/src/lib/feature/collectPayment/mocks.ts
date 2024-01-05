import { CollectPaymentPayload, Payment } from './types';

export const mockPaymentData: Payment = {
  paymentId: 123,
  errorText: '',
  success: true,
};

export const mockCollectPaymentPayload: CollectPaymentPayload = {
  accountNumber: '4000 0000 0000 0002',
  departmentId: 1,
  billingAddress: '123 Main St.',
  billingZip: '12345',
  cvv: 123,
  expirationMonth: 12,
  expirationYear: 2023,
  nameOnCard: 'John Dow',
  amount: '123',
  patientId: '1234',
};
