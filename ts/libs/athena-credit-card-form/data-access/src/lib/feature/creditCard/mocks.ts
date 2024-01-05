import { CreditCardsQuery } from '../../types';
import {
  DeleteCreditCardPayload,
  DeleteCreditCardResult,
  SaveCreditCardPayload,
  SavedCreditCardData,
} from './types';

export const mockSavedCreditCardData: SavedCreditCardData = {
  storedCardId: '1',
  errorText: '',
  success: true,
};

export const mockSaveCreditCardPayload: SaveCreditCardPayload = {
  accountNumber: '4000 0000 0000 0002',
  departmentId: 1,
  billingAddress: '123 Main St.',
  billingZip: '12345',
  cvv: 123,
  expirationMonth: 12,
  expirationYear: 2023,
  nameOnCard: 'John Dow',
  patientId: '1234',
};

export const mockCreditCardsQuery: CreditCardsQuery = {
  departmentId: '1',
  patientId: '1234',
};

export const mockDeleteCreditCardResultData: DeleteCreditCardResult = {
  errorText: '',
  success: true,
};

export const mockDeleteCreditCardPayload: DeleteCreditCardPayload = {
  departmentId: '1',
  patientId: '1234',
  creditCardId: '12345',
};
