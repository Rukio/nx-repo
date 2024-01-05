import {
  PhoneNumber,
  PhoneNumber_PhoneNumberType,
} from '@*company-data-covered*/protos/common/demographic';

export const buildMockPhoneNumber = (
  init: Partial<PhoneNumber> = {}
): PhoneNumber => {
  const result: PhoneNumber = {
    countryCode: 1,
    phoneNumber: '3035551234',
    phoneNumberType: PhoneNumber_PhoneNumberType.PHONE_NUMBER_TYPE_MOBILE,
  };

  return Object.assign(result, init);
};
