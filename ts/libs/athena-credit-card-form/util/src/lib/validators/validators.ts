import { number, cvv, expirationDate } from 'card-validator';

export type FieldValidation = {
  isValid: boolean;
  errorMessage: string;
};

export const VALID_ZIP_CODE_REG_EXP = /^\d{5}(-?\d{4})?$/g;

export const validateRequiredField = (
  value: string,
  errorMessage = 'This field is required'
): FieldValidation => {
  const isValid = value.trim().length > 0;

  return {
    isValid,
    errorMessage: !isValid ? errorMessage : '',
  };
};

export const validateZipCode = (
  value: string,
  errorMessage = 'Invalid zip code'
): FieldValidation => {
  const isValid = new RegExp(VALID_ZIP_CODE_REG_EXP).test(value);

  return {
    isValid,
    errorMessage: !isValid ? errorMessage : '',
  };
};

export const validateCreditCardNumber = (
  value: string,
  errorMessage = 'Invalid credit card number'
) => {
  const { isValid } = number(value);

  return {
    isValid,
    errorMessage: !isValid ? errorMessage : '',
  };
};

export const validateCreditCardCVV = (
  value: string,
  errorMessage = 'Invalid credit card CVV'
): FieldValidation => {
  const { isValid: isCommonCVVValid } = cvv(value);
  const { isValid: isAmericanExpressCVVValid } = cvv(value, 4);

  const isValid = isCommonCVVValid || isAmericanExpressCVVValid;

  return {
    isValid,
    errorMessage: !isValid ? errorMessage : '',
  };
};

export const validateCreditCardExpirationDate = (
  value: string,
  errorMessage = 'Invalid credit card expiration date'
): FieldValidation => {
  const { isValid } = expirationDate(value);

  return {
    isValid,
    errorMessage: !isValid ? errorMessage : '',
  };
};

export const validateBillingStreetAddress = (
  value: string,
  errorMessage = 'Invalid billing street address'
): FieldValidation => {
  const valueLength = value.trim().length;
  const isValid = !!valueLength && valueLength <= 20;

  return {
    isValid,
    errorMessage: !isValid ? errorMessage : '',
  };
};
