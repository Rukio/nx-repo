import { isValidPhoneNumber as libphonenumberIsValidPhoneNumber } from 'libphonenumber-js';

export const hasValue = (value: string | undefined) =>
  value && value?.trim().length > 0;

export const isValidZipCode = (value: string) => /^\d{5}$/.test(value);

export const isValidPhoneNumber = (value: string) =>
  libphonenumberIsValidPhoneNumber(value, 'US');
