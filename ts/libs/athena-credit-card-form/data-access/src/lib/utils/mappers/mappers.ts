import { Payment } from '../../feature/collectPayment/types';
import {
  CreditCard,
  DeleteCreditCardResult,
  SavedCreditCardData,
} from '../../feature/creditCard/types';
import {
  DomainCreditCard,
  DomainDeleteCreditCardResult,
  DomainPayment,
  DomainSavedCreditCardData,
} from '../../types';

const transformStringToBoolean = (value?: string) =>
  value?.toLowerCase() === 'true';

export const toPaymentData = (payment: DomainPayment): Payment => {
  return {
    ...payment,
    success: transformStringToBoolean(payment.success),
  };
};

export const toSavedCreditCardData = (
  savedCreditCardData: DomainSavedCreditCardData
): SavedCreditCardData => {
  return {
    ...savedCreditCardData,
    success: transformStringToBoolean(savedCreditCardData.success),
  };
};

export const toCreditCards = (
  creditCards?: DomainCreditCard[]
): CreditCard[] => {
  return (
    creditCards?.map((creditCard) => ({
      ...creditCard,
      isPreferredCard: transformStringToBoolean(creditCard.isPreferredCard),
    })) ?? []
  );
};

export const toDeleteCreditCardResult = (
  deleteCreditCardResult: DomainDeleteCreditCardResult
): DeleteCreditCardResult => {
  return {
    ...deleteCreditCardResult,
    success: deleteCreditCardResult.success?.toLowerCase() === 'true',
  };
};
