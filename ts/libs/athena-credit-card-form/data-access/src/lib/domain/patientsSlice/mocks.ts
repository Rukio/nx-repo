import {
  DomainDeleteCreditCardResult,
  DomainSavedCreditCardData,
  DomainPayment,
  DomainCreditCard,
  PaymentSuccessStatus,
  CreditCardStatus,
} from '../../types';

export const mockPayment: DomainPayment = {
  paymentId: 123,
  errorText: '',
  success: PaymentSuccessStatus.True,
};

export const mockSavedCreditCard: DomainSavedCreditCardData = {
  storedCardId: '70029',
  errorText: '',
  success: 'true',
};

export const mockCreditCards: DomainCreditCard[] = [
  {
    id: '1',
    status: CreditCardStatus.Active,
    cardType: 'Visa',
    billingZip: '43004',
    billingCity: '',
    billingState: '',
    isPreferredCard: 'false',
    billingAddress: '123 Doe st.',
    expirationMonthYear: '12/2025',
    numberLastFourDigits: '0002',
  },
];

export const mockDeleteCreditCardResult: DomainDeleteCreditCardResult = {
  errorText: '',
  success: 'true',
};
