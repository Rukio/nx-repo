import { AsYouType, parsePhoneNumber } from 'libphonenumber-js';

export const US_PHONE_NUMBER_LENGTH = 10;

export const formatPhoneNumber = (value: string) => {
  return value.length < US_PHONE_NUMBER_LENGTH
    ? new AsYouType('US').input(value)
    : parsePhoneNumber(value, 'US').formatNational();
};
