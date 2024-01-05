import { SerializedError } from '@reduxjs/toolkit';
import { CreditCardStatus } from '../../types';

export type SaveCreditCardPayload = {
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

export type SavedCreditCardData = {
  storedCardId?: string;
  errorText?: string;
  success: boolean;
};

export type CreditCard = {
  id: string;
  status: CreditCardStatus;
  cardType: string;
  billingZip: string;
  billingCity: string;
  billingState: string;
  isPreferredCard: boolean;
  billingAddress: string;
  expirationMonthYear: string;
  numberLastFourDigits: string;
};

export type DeleteCreditCardPayload = {
  departmentId: string;
  patientId: string;
  creditCardId: string;
};

export type DeleteCreditCardResult = {
  errorText?: string;
  success: boolean;
};

export interface CreditCardState {
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: SerializedError;
  savedCreditCardData?: SavedCreditCardData | null;
  deleteCreditCardResult?: DeleteCreditCardResult;
}
