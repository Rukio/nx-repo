import {
  mockCreditCards,
  mockDeleteCreditCardResult,
  mockPayment,
  mockSavedCreditCard,
} from '../../domain/patientsSlice/mocks';
import {
  toCreditCards,
  toDeleteCreditCardResult,
  toPaymentData,
  toSavedCreditCardData,
} from './mappers';

describe('utils mappers', () => {
  describe('toPaymentData', () => {
    it('should transform domain model to payment data', () => {
      const result = toPaymentData(mockPayment);
      expect(result).toEqual({
        paymentId: mockPayment.paymentId,
        errorText: mockPayment.errorText,
        success: true,
      });
    });
  });

  describe('toSavedCreditCardData', () => {
    it('should transform domain model to payment data', () => {
      const result = toSavedCreditCardData(mockSavedCreditCard);
      expect(result).toEqual({
        storedCardId: mockSavedCreditCard.storedCardId,
        errorText: mockSavedCreditCard.errorText,
        success: true,
      });
    });
  });

  describe('toCreditCards', () => {
    it('should transform domain model to credit cards data', () => {
      const mockCreditCard = mockCreditCards[0];
      const result = toCreditCards(mockCreditCards);
      expect(result).toEqual([
        {
          ...mockCreditCard,
          isPreferredCard: false,
        },
      ]);
    });

    it('should return empty array if data is undefined', () => {
      const result = toCreditCards();
      expect(result).toEqual([]);
    });
  });

  describe('toDeleteCreditCardResult', () => {
    it('should transform domain model to delete credit card result data', () => {
      const result = toDeleteCreditCardResult(mockDeleteCreditCardResult);
      expect(result).toEqual({
        errorText: mockSavedCreditCard.errorText,
        success: true,
      });
    });
  });
});
