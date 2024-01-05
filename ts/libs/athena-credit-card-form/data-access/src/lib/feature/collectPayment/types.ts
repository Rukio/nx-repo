import type { SerializedError } from '@reduxjs/toolkit';

export type CollectPaymentPayload = {
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

export type Payment = {
  paymentId: number;
  errorText?: string;
  success: boolean;
};

export interface CollectPaymentState {
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  error?: SerializedError;
  payment?: Payment;
}
