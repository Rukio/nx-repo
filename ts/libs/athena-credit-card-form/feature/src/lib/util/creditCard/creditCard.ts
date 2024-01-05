import { number } from 'card-validator';

export const getCreditCardType = (creditCardNumber: string) => {
  const { card } = number(creditCardNumber);

  if (!card) {
    return null;
  }

  return card.niceType;
};

export const getCreditCardLast4Digits = (creditCardNumber: string) => {
  if (!number(creditCardNumber).isValid) {
    return '';
  }

  const trimmedCreditCardNumber = creditCardNumber.replace(/\s/g, '');

  return trimmedCreditCardNumber.slice(-4);
};
