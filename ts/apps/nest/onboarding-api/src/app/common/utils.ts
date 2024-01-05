import parsePhoneNumber from 'libphonenumber-js';
import {
  PhoneNumber,
  PhoneNumber_PhoneNumberType,
} from '@*company-data-covered*/protos/nest/common/demographic';
import { AddressValidationStatus } from '@*company-data-covered*/protos/nest/patients/accounts/service';
import { AddressStatus } from '@*company-data-covered*/consumer-web-types';

export const SEARCH_TERM_REGEX = /(^,)|(,\s$)/;

export function pagedArray<T>(array: T[], limit: number, offset: number): T[] {
  if (!array) {
    return [];
  }

  const { length } = array;

  if (!length || offset < 0 || limit < 0 || offset > length - 1) {
    return [];
  }

  const start = offset;
  const end = Math.min(length, start + limit);

  return array.slice(start, end);
}

export const unparsePhoneNumber = (val?: string) =>
  val ? val.replace('+1', '') : '';

export const getPhoneNumber = (phone: string): PhoneNumber => {
  if (!phone) {
    return undefined;
  }
  const phoneNumber = parsePhoneNumber(phone, 'US');
  if (phoneNumber) {
    return {
      // TODO: update this once we get a suitable library to perform phone type checks
      phone_number_type:
        PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_UNSPECIFIED,
      phone_number: phoneNumber.nationalNumber,
      country_code: parseInt(phoneNumber.countryCallingCode),
    };
  }
};

export const getAddressStatus = (
  status: AddressValidationStatus
): AddressStatus => {
  switch (status) {
    case AddressValidationStatus.ADDRESS_VALIDATION_STATUS_INVALID:
      return AddressStatus.INVALID;
    case AddressValidationStatus.ADDRESS_VALIDATION_STATUS_VALID:
      return AddressStatus.VALID;
    case AddressValidationStatus.ADDRESS_VALIDATION_STATUS_NEEDS_CONFIRMATION:
      return AddressStatus.CONFIRM;
    default:
      return AddressStatus.UNSPECIFIED;
  }
};
