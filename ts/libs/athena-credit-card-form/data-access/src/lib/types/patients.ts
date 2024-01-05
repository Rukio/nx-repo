export enum PaymentSuccessStatus {
  True = 'true',
  False = 'false',
}

export type DomainPayment = {
  paymentId: number;
  errorText?: string;
  success: PaymentSuccessStatus;
};

export type CreatePaymentRequestDataPayload = {
  accountNumber: string;
  departmentId: number;
  billingAddress: string;
  billingZip: string;
  cvv: number;
  expirationMonth: number;
  expirationYear: number;
  nameOnCard: string;
  amount: string;
  patientId: string;
};

export type DomainSavedCreditCardData = {
  storedCardId?: string;
  errorText?: string;
  success: string;
};

export type SaveCreditCardRequestDataPayload = {
  accountNumber: string;
  departmentId: number;
  billingAddress: string;
  billingZip: string;
  cvv: number;
  expirationMonth: number;
  expirationYear: number;
  nameOnCard: string;
  patientId: string;
};

export enum CreditCardStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
}

export type DomainCreditCard = {
  id: string;
  status: CreditCardStatus;
  cardType: string;
  billingZip: string;
  billingCity: string;
  billingState: string;
  isPreferredCard: string;
  billingAddress: string;
  expirationMonthYear: string;
  numberLastFourDigits: string;
};

export type CreditCardsQuery = {
  departmentId: string;
  patientId: string;
};

export type DomainDeleteCreditCardResult = {
  errorText?: string;
  success: string;
};

export type DeleteCreditCardRequestDataPayload = {
  creditCardId: string;
  departmentId: string;
  patientId: string;
};
